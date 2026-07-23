-- MZ TAILOR - DEMO DATA + PERUBAHAN PESANAN TERBARU
-- Jalankan sekali pada database yang sudah pernah menjalankan schema.
-- File ini tidak membuat ulang enum/tabel sehingga aman dari error order_status already exists.

-- Struktur terbaru: ukuran per item, kalkulasi harga, dan reward diskon pada order.
revoke execute on function public.create_public_order(text,text,text,jsonb,text,jsonb) from anon;
grant execute on function public.create_public_order(text,text,text,jsonb,text,jsonb) to authenticated;
drop policy if exists "public uploads order references" on storage.objects;
drop policy if exists "admin uploads order references" on storage.objects;
create policy "admin uploads order references" on storage.objects for insert to authenticated with check (bucket_id='order-references' and public.is_admin());
alter table public.order_items add column if not exists measurements jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists subtotal numeric(14,2) not null default 0 check(subtotal >= 0);
alter table public.orders add column if not exists discount_amount numeric(14,2) not null default 0 check(discount_amount >= 0);
alter table public.orders add column if not exists applied_reward_id uuid references public.rewards(id) on delete set null;
alter table public.reward_redemptions add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.rewards add column if not exists reward_type text not null default 'discount_percent' check(reward_type in ('discount_percent','discount_amount','item'));
alter table public.rewards add column if not exists discount_value numeric(14,2) not null default 0 check(discount_value >= 0);
alter table public.rewards add column if not exists item_name text;

-- RPC pembuatan order baru dengan ukuran per item, kalkulasi, dan pemakaian diskon atomik.
create or replace function public.create_admin_order(
 p_name text, p_whatsapp text, p_address text, p_notes text, p_items jsonb,
 p_estimated_completion date, p_status public.order_status, p_reward_id uuid default null
) returns text language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_order uuid; v_number text; v_seq integer; v_month text; v_item jsonb; v_subtotal numeric:=0; v_discount numeric:=0; v_reward public.rewards%rowtype;
begin
 if not public.is_admin() then raise exception 'Akses ditolak'; end if;
 if length(trim(p_name))<2 or length(regexp_replace(p_whatsapp,'\D','','g'))<9 or jsonb_array_length(p_items)<1 then raise exception 'Data pesanan tidak lengkap'; end if;
 if p_reward_id is not null then select * into v_reward from public.rewards where id=p_reward_id and is_active=true and reward_type in ('discount_percent','discount_amount') for update; if not found then raise exception 'Reward diskon tidak tersedia'; end if; end if;
 v_month=to_char(now(),'YYYYMM'); perform pg_advisory_xact_lock(hashtext('mzt-'||v_month)); select coalesce(max(right(order_number,4)::integer),0)+1 into v_seq from public.orders where order_number like 'MZT-'||v_month||'-%'; v_number='MZT-'||v_month||'-'||lpad(v_seq::text,4,'0');
 insert into public.customers(name,whatsapp,address) values(trim(p_name),trim(p_whatsapp),nullif(trim(p_address),'')) on conflict(whatsapp) do update set name=excluded.name,address=excluded.address,updated_at=now() returning id into v_customer;
 if p_reward_id is not null then perform 1 from public.customers where id=v_customer and active_stamps=5 and available_rewards>0 for update; if not found then raise exception 'Pelanggan belum memiliki reward aktif'; end if; end if;
 insert into public.orders(order_number,customer_id,status,notes,estimated_completion,subtotal,total_price,applied_reward_id) values(v_number,v_customer,p_status,p_notes,p_estimated_completion,0,0,p_reward_id) returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if length(trim(v_item->>'clothing_type'))=0 or length(trim(v_item->>'model'))=0 then raise exception 'Jenis dan model item wajib diisi'; end if;
   insert into public.order_items(order_id,clothing_type,model,quantity,unit_price,measurements,reference_path) values(v_order,trim(v_item->>'clothing_type'),trim(v_item->>'model'),greatest(1,(v_item->>'quantity')::integer),greatest(0,(v_item->>'unit_price')::numeric),coalesce(v_item->'measurements','{}'::jsonb),nullif(v_item->>'reference_path',''));
   v_subtotal := v_subtotal + greatest(1,(v_item->>'quantity')::integer) * greatest(0,(v_item->>'unit_price')::numeric);
 end loop;
 if p_reward_id is not null then
   if v_reward.reward_type='discount_percent' then v_discount:=round(v_subtotal*least(v_reward.discount_value,100)/100,2); else v_discount:=least(v_subtotal,v_reward.discount_value); end if;
   if v_reward.stock is not null and v_reward.stock<1 then raise exception 'Stok reward habis'; end if;
   if v_reward.stock is not null then update public.rewards set stock=stock-1 where id=p_reward_id; end if;
   insert into public.reward_redemptions(customer_id,reward_id,order_id,stamps_used,redeemed_by) values(v_customer,p_reward_id,v_order,5,auth.uid()); update public.customers set active_stamps=0,available_rewards=available_rewards-1 where id=v_customer;
 end if;
 update public.orders set subtotal=v_subtotal,discount_amount=v_discount,total_price=greatest(0,v_subtotal-v_discount) where id=v_order;
 return v_number;
end; $$;
revoke all on function public.create_admin_order(text,text,text,text,jsonb,date,public.order_status,uuid) from public;
grant execute on function public.create_admin_order(text,text,text,text,jsonb,date,public.order_status,uuid) to authenticated;

-- Reward demo: hanya diskon, tidak ada reward item.
insert into public.rewards(id,name,description,stamp_cost,stock,is_active,reward_type,discount_value,item_name) values
('40000000-0000-0000-0000-000000000001','Diskon Loyal 10%','Potongan 10% untuk satu pesanan setelah lima stempel.',5,50,true,'discount_percent',10,null),
('40000000-0000-0000-0000-000000000002','Potongan Loyal Rp50.000','Potongan Rp50.000 untuk satu pesanan setelah lima stempel.',5,25,true,'discount_amount',50000,null)
on conflict (id) do update set name=excluded.name,description=excluded.description,stock=excluded.stock,is_active=excluded.is_active,reward_type=excluded.reward_type,discount_value=excluded.discount_value,item_name=null;

-- Pelanggan demo. Andi memiliki 5 stempel dan 1 reward aktif untuk diuji.
insert into public.customers(id,name,whatsapp,address,active_stamps,available_rewards) values
('10000000-0000-0000-0000-000000000001','Budi Santoso','6281211111111','Jl. Kenanga No. 8, Bandung',2,0),
('10000000-0000-0000-0000-000000000002','Raka Pratama','6281222222222','Jl. Melati No. 21, Jakarta',3,0),
('10000000-0000-0000-0000-000000000003','Andi Wijaya','6281233333333','Jl. Mawar No. 4, Depok',5,1),
('10000000-0000-0000-0000-000000000004','Dimas Kurniawan','6281244444444','Jl. Anggrek No. 16, Tangerang',0,0)
on conflict (id) do update set name=excluded.name,whatsapp=excluded.whatsapp,address=excluded.address,active_stamps=excluded.active_stamps,available_rewards=excluded.available_rewards;

insert into public.customer_measurements(customer_id,label,measurements,notes) values
('10000000-0000-0000-0000-000000000001','Ukuran utama','{"chest":"102","waist":"88","length":"72","shoulder":"45","sleeve":"61"}'::jsonb,'Ukuran demo.'),
('10000000-0000-0000-0000-000000000003','Ukuran utama','{"chest":"106","waist":"92","length":"74","shoulder":"47","sleeve":"63"}'::jsonb,'Pelanggan siap memakai reward diskon.')
on conflict do nothing;

-- Pesanan demo dengan progres berbeda dan subtotal/total yang sudah terisi.
insert into public.orders(id,order_number,customer_id,status,notes,subtotal,discount_amount,total_price,estimated_completion) values
('20000000-0000-0000-0000-000000000001','MZT-202607-2001','10000000-0000-0000-0000-000000000001','received','Kemeja formal warna hijau.',450000,0,450000,'2026-07-27'),
('20000000-0000-0000-0000-000000000002','MZT-202607-2002','10000000-0000-0000-0000-000000000002','in_progress','Setelan untuk acara keluarga.',1250000,0,1250000,'2026-07-29'),
('20000000-0000-0000-0000-000000000003','MZT-202607-2003','10000000-0000-0000-0000-000000000003','ready','Andi memiliki reward diskon aktif untuk pesanan berikutnya.',500000,0,500000,'2026-07-25'),
('20000000-0000-0000-0000-000000000004','MZT-202607-2004','10000000-0000-0000-0000-000000000003','completed','Pesanan selesai; reward berikutnya dapat dipakai.',400000,0,400000,'2026-07-20')
on conflict (id) do update set status=excluded.status,notes=excluded.notes,subtotal=excluded.subtotal,discount_amount=excluded.discount_amount,total_price=excluded.total_price,estimated_completion=excluded.estimated_completion;

insert into public.order_items(id,order_id,clothing_type,model,quantity,unit_price,measurements) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Kemeja','Kemeja formal slim fit',2,225000,'{"chest":"102","waist":"88","length":"72","shoulder":"45","sleeve":"61"}'::jsonb),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Jas','Setelan jas two-piece',1,1250000,'{"chest":"98","waist":"82","length":"70","shoulder":"44","sleeve":"60"}'::jsonb),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Baju koko','Koko bordir modern',1,500000,'{"chest":"106","waist":"92","length":"74","shoulder":"47","sleeve":"63"}'::jsonb),
('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','Kemeja','Kemeja putih oxford',1,400000,'{"chest":"106","waist":"92","length":"74","shoulder":"47","sleeve":"63"}'::jsonb)
on conflict (id) do update set clothing_type=excluded.clothing_type,model=excluded.model,quantity=excluded.quantity,unit_price=excluded.unit_price,measurements=excluded.measurements;

-- Pastikan pelanggan reward demo tetap siap untuk pengujian claim pada order baru.
update public.customers set active_stamps=5,available_rewards=1 where id='10000000-0000-0000-0000-000000000003';

select 'Demo siap: Andi Wijaya memiliki 5 stempel dan 1 reward diskon aktif.' as hasil;
