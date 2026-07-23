-- Relasi ukuran per item dan reward yang dipakai di pesanan.
alter table public.order_items add column if not exists measurements jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists subtotal numeric(14,2) not null default 0 check(subtotal >= 0);
alter table public.orders add column if not exists discount_amount numeric(14,2) not null default 0 check(discount_amount >= 0);
alter table public.orders add column if not exists applied_reward_id uuid references public.rewards(id) on delete set null;
alter table public.reward_redemptions add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.rewards add column if not exists reward_type text not null default 'item' check(reward_type in ('discount_percent','discount_amount','item'));
alter table public.rewards add column if not exists discount_value numeric(14,2) not null default 0 check(discount_value >= 0);
alter table public.rewards add column if not exists item_name text;

create or replace function public.create_admin_order(
 p_name text, p_whatsapp text, p_address text, p_notes text, p_items jsonb,
 p_estimated_completion date, p_status public.order_status, p_reward_id uuid default null
) returns text language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_order uuid; v_number text; v_seq integer; v_month text; v_item jsonb; v_subtotal numeric:=0; v_discount numeric:=0; v_reward public.rewards%rowtype;
begin
 if not public.is_admin() then raise exception 'Akses ditolak'; end if;
 if length(trim(p_name))<2 or length(regexp_replace(p_whatsapp,'\D','','g'))<9 or jsonb_array_length(p_items)<1 then raise exception 'Data pesanan tidak lengkap'; end if;
 if p_reward_id is not null then select * into v_reward from public.rewards where id=p_reward_id and is_active=true for update; if not found then raise exception 'Reward tidak tersedia'; end if; end if;
 v_month=to_char(now(),'YYYYMM'); perform pg_advisory_xact_lock(hashtext('mzt-'||v_month)); select coalesce(max(right(order_number,4)::integer),0)+1 into v_seq from public.orders where order_number like 'MZT-'||v_month||'-%';
 v_number='MZT-'||v_month||'-'||lpad(v_seq::text,4,'0');
 insert into public.customers(name,whatsapp,address) values(trim(p_name),trim(p_whatsapp),nullif(trim(p_address),'')) on conflict(whatsapp) do update set name=excluded.name,address=excluded.address,updated_at=now() returning id into v_customer;
 if p_reward_id is not null then perform 1 from public.customers where id=v_customer and active_stamps=5 and available_rewards>0 for update; if not found then raise exception 'Pelanggan belum memiliki reward aktif'; end if; end if;
 insert into public.orders(order_number,customer_id,status,notes,estimated_completion,subtotal,total_price,applied_reward_id) values(v_number,v_customer,p_status,p_notes,p_estimated_completion,0,0,p_reward_id) returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if length(trim(v_item->>'clothing_type'))=0 or length(trim(v_item->>'model'))=0 then raise exception 'Jenis dan model item wajib diisi'; end if;
   insert into public.order_items(order_id,clothing_type,model,quantity,unit_price,measurements,reference_path) values(v_order,trim(v_item->>'clothing_type'),trim(v_item->>'model'),greatest(1,(v_item->>'quantity')::integer),greatest(0,(v_item->>'unit_price')::numeric),coalesce(v_item->'measurements','{}'::jsonb),nullif(v_item->>'reference_path',''));
   v_subtotal := v_subtotal + greatest(1,(v_item->>'quantity')::integer) * greatest(0,(v_item->>'unit_price')::numeric);
 end loop;
 if p_reward_id is not null then
   if v_reward.reward_type='discount_percent' then v_discount:=round(v_subtotal*least(v_reward.discount_value,100)/100,2); elsif v_reward.reward_type='discount_amount' then v_discount:=least(v_subtotal,v_reward.discount_value); end if;
   if v_reward.stock is not null and v_reward.stock<1 then raise exception 'Stok reward habis'; end if;
   if v_reward.stock is not null then update public.rewards set stock=stock-1 where id=p_reward_id; end if;
   insert into public.reward_redemptions(customer_id,reward_id,order_id,stamps_used,redeemed_by) values(v_customer,p_reward_id,v_order,5,auth.uid()); update public.customers set active_stamps=0,available_rewards=available_rewards-1 where id=v_customer and active_stamps=5 and available_rewards>0;
 end if;
 update public.orders set subtotal=v_subtotal,discount_amount=v_discount,total_price=greatest(0,v_subtotal-v_discount) where id=v_order;
 return v_number;
end; $$;
revoke all on function public.create_admin_order(text,text,text,text,jsonb,date,public.order_status,uuid) from public;
grant execute on function public.create_admin_order(text,text,text,text,jsonb,date,public.order_status,uuid) to authenticated;
