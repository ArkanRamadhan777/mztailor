-- MZ TAILOR - initial database, RLS, storage, and business rules
create extension if not exists pgcrypto;

create type public.order_status as enum ('received','confirmed','in_progress','finishing','ready','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(), name text not null, whatsapp text not null unique,
  address text, active_stamps integer not null default 0 check (active_stamps between 0 and 5),
  available_rewards integer not null default 0 check (available_rewards >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.customer_measurements (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Ukuran utama', measurements jsonb not null default '{}'::jsonb, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique, customer_id uuid not null references public.customers(id) on delete restrict,
  status public.order_status not null default 'received', notes text, total_price numeric(14,2) not null default 0 check(total_price >= 0),
  estimated_completion date, stamp_awarded boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  clothing_type text not null, model text not null, quantity integer not null default 1 check(quantity > 0),
  unit_price numeric(14,2) not null default 0 check(unit_price >= 0), reference_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  old_status public.order_status, new_status public.order_status not null, changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(), name text not null, description text, starting_price numeric(14,2), icon text,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portfolios (
  id uuid primary key default gen_random_uuid(), title text not null, description text, image_url text not null, category text,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.stamp_history (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict, amount integer not null default 1 check(amount = 1),
  created_at timestamptz not null default now()
);
create table public.rewards (
  id uuid primary key default gen_random_uuid(), name text not null, description text, stamp_cost integer not null default 5 check(stamp_cost = 5),
  stock integer check(stock is null or stock >= 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete restrict,
  reward_id uuid not null references public.rewards(id) on delete restrict, stamps_used integer not null default 5 check(stamps_used = 5),
  redeemed_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id) on delete set null,
  phone text not null, message text not null, status public.order_status, sent_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.business_settings (
  id uuid primary key default gen_random_uuid(), business_name text not null default 'MZ TAILOR', tagline text not null,
  description text not null, whatsapp text not null, address text not null, instagram text, hours text not null, hero_image_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index orders_customer_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index order_items_order_idx on public.order_items(order_id);
create index measurements_customer_idx on public.customer_measurements(customer_id);
create index stamps_customer_idx on public.stamp_history(customer_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
do $$ declare t text; begin foreach t in array array['profiles','customers','customer_measurements','orders','order_items','services','portfolios','rewards','business_settings'] loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),case when not exists(select 1 from public.profiles where role='admin') then 'admin' else 'staff' end); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke all on function public.is_admin() from public; grant execute on function public.is_admin() to authenticated;

create or replace function public.record_order_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='INSERT' then insert into public.order_status_history(order_id,old_status,new_status,changed_by) values(new.id,null,new.status,auth.uid());
  elsif old.status is distinct from new.status then insert into public.order_status_history(order_id,old_status,new_status,changed_by) values(new.id,old.status,new.status,auth.uid()); end if;
  return new;
end; $$;
create trigger record_order_status after insert or update of status on public.orders for each row execute function public.record_order_status();

create or replace function public.award_completed_order_stamp() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status='completed' and old.status is distinct from 'completed' and new.stamp_awarded=false then
    insert into public.stamp_history(customer_id,order_id,amount) values(new.customer_id,new.id,1) on conflict(order_id) do nothing;
    if found then
      update public.customers set active_stamps=least(active_stamps+1,5), available_rewards=available_rewards + case when active_stamps=4 then 1 else 0 end where id=new.customer_id;
      new.stamp_awarded=true;
    end if;
  end if;
  return new;
end; $$;
create trigger award_stamp before update of status on public.orders for each row execute function public.award_completed_order_stamp();

create or replace function public.create_public_order(
 p_name text,p_whatsapp text,p_address text,p_measurements jsonb,p_notes text,p_items jsonb
) returns text language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_order uuid; v_number text; v_seq integer; v_month text; v_item jsonb;
begin
 if not public.is_admin() then raise exception 'Akses ditolak'; end if;
 if length(trim(p_name))<2 or length(regexp_replace(p_whatsapp,'\D','','g'))<9 or jsonb_array_length(p_items)<1 then raise exception 'Data pemesanan tidak lengkap'; end if;
 v_month=to_char(now(),'YYYYMM'); perform pg_advisory_xact_lock(hashtext('mzt-'||v_month));
 select coalesce(max(right(order_number,4)::integer),0)+1 into v_seq from public.orders where order_number like 'MZT-'||v_month||'-%';
 if v_seq>9999 then raise exception 'Kapasitas nomor pesanan bulan ini penuh'; end if;
 v_number='MZT-'||v_month||'-'||lpad(v_seq::text,4,'0');
 insert into public.customers(name,whatsapp,address) values(trim(p_name),trim(p_whatsapp),trim(p_address))
 on conflict(whatsapp) do update set name=excluded.name,address=excluded.address,updated_at=now() returning id into v_customer;
 if p_measurements is not null and p_measurements <> '{}'::jsonb and exists(select 1 from jsonb_each_text(p_measurements) where value<>'') then
   insert into public.customer_measurements(customer_id,label,measurements,notes) values(v_customer,'Ukuran dari '||v_number,p_measurements,'Dikirim melalui form pemesanan');
 end if;
 insert into public.orders(order_number,customer_id,notes) values(v_number,v_customer,p_notes) returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
   insert into public.order_items(order_id,clothing_type,model,quantity,reference_path) values(v_order,trim(v_item->>'clothing_type'),trim(v_item->>'model'),greatest(1,(v_item->>'quantity')::integer),nullif(v_item->>'reference_path',''));
 end loop;
 return v_number;
end; $$;
revoke all on function public.create_public_order(text,text,text,jsonb,text,jsonb) from public;
grant execute on function public.create_public_order(text,text,text,jsonb,text,jsonb) to authenticated;

create or replace function public.redeem_customer_reward(p_customer_id uuid,p_reward_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_stock integer;
begin
 if not public.is_admin() then raise exception 'Akses ditolak'; end if;
 perform 1 from public.customers where id=p_customer_id and active_stamps=5 and available_rewards>0 for update;
 if not found then raise exception 'Pelanggan belum memiliki reward aktif'; end if;
 select stock into v_stock from public.rewards where id=p_reward_id and is_active=true for update;
 if not found or (v_stock is not null and v_stock<1) then raise exception 'Reward tidak tersedia'; end if;
 insert into public.reward_redemptions(customer_id,reward_id,redeemed_by) values(p_customer_id,p_reward_id,auth.uid()) returning id into v_id;
 update public.customers set active_stamps=0,available_rewards=available_rewards-1 where id=p_customer_id;
 if v_stock is not null then update public.rewards set stock=stock-1 where id=p_reward_id; end if;
 return v_id;
end; $$;
revoke all on function public.redeem_customer_reward(uuid,uuid) from public; grant execute on function public.redeem_customer_reward(uuid,uuid) to authenticated;

-- RLS: public sees only active marketing content and business profile. All private tables require an admin session.
do $$ declare t text; begin foreach t in array array['profiles','customers','customer_measurements','orders','order_items','order_status_history','services','portfolios','stamp_history','rewards','reward_redemptions','whatsapp_message_logs','business_settings'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy "admin profiles" on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin customers" on public.customers for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin measurements" on public.customer_measurements for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin orders" on public.orders for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin items" on public.order_items for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin status history" on public.order_status_history for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "public active services" on public.services for select to anon using(is_active);
create policy "admin services" on public.services for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "public active portfolios" on public.portfolios for select to anon using(is_active);
create policy "admin portfolios" on public.portfolios for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin stamps" on public.stamp_history for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin rewards" on public.rewards for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin redemptions" on public.reward_redemptions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin whatsapp logs" on public.whatsapp_message_logs for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "public business profile" on public.business_settings for select to anon,authenticated using(true);
create policy "admin business settings" on public.business_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('order-references','order-references',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('portfolio','portfolio',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy "admin uploads order references" on storage.objects for insert to authenticated with check(bucket_id='order-references' and public.is_admin());
create policy "admin reads order references" on storage.objects for select to authenticated using(bucket_id='order-references' and public.is_admin());
create policy "admin manages order references" on storage.objects for all to authenticated using(bucket_id='order-references' and public.is_admin()) with check(bucket_id='order-references' and public.is_admin());
create policy "public reads portfolio" on storage.objects for select to anon,authenticated using(bucket_id='portfolio');
create policy "admin manages portfolio" on storage.objects for all to authenticated using(bucket_id='portfolio' and public.is_admin()) with check(bucket_id='portfolio' and public.is_admin());


-- Refresh the initial portfolio examples for the bright-green menswear direction.
update public.portfolios set
  title = 'Kemeja Hijau Modern',
  description = 'Potongan bersih dengan ukuran yang presisi.',
  image_url = '/images/menswear-hero.png',
  category = 'Kemeja Pria'
where sort_order = 1;

update public.portfolios set
  title = 'Setelan Linen Pria',
  description = 'Ringan, rapi, dan nyaman untuk acara istimewa.',
  image_url = '/images/menswear-suit.png',
  category = 'Setelan Pria'
where sort_order = 2;

update public.portfolios set
  title = 'Baju Koko Modern',
  description = 'Detail bordir lembut dengan siluet kontemporer.',
  image_url = '/images/menswear-koko.png',
  category = 'Busana Pria'
where sort_order = 3;


-- Optional demo data for local/staging preview. Safe to run once after the main setup.
insert into public.customers(id,name,whatsapp,address) values
('10000000-0000-0000-0000-000000000001','Budi Santoso','6281211111111','Jl. Kenanga No. 8, Bandung'),
('10000000-0000-0000-0000-000000000002','Raka Pratama','6281222222222','Jl. Melati No. 21, Jakarta'),
('10000000-0000-0000-0000-000000000003','Andi Wijaya','6281233333333','Jl. Mawar No. 4, Depok'),
('10000000-0000-0000-0000-000000000004','Dimas Kurniawan','6281244444444','Jl. Anggrek No. 16, Tangerang')
on conflict (id) do update set name=excluded.name,whatsapp=excluded.whatsapp,address=excluded.address;

insert into public.customer_measurements(customer_id,label,measurements,notes) values
('10000000-0000-0000-0000-000000000001','Ukuran utama','{"chest":"102","waist":"88","hips":"100","length":"72","shoulder":"45","sleeve":"61"}'::jsonb,'Ukuran dicatat saat fitting.'),
('10000000-0000-0000-0000-000000000002','Ukuran kerja','{"chest":"98","waist":"82","hips":"96","length":"70","shoulder":"44","sleeve":"60"}'::jsonb,'Untuk kemeja kantor.'),
('10000000-0000-0000-0000-000000000003','Ukuran utama','{"chest":"106","waist":"92","hips":"104","length":"74","shoulder":"47","sleeve":"63"}'::jsonb,'Ukuran terakhir diperbarui.'),
('10000000-0000-0000-0000-000000000004','Ukuran utama','{"chest":"100","waist":"86","hips":"98","length":"71","shoulder":"45","sleeve":"61"}'::jsonb,'')
on conflict do nothing;

insert into public.orders(id,order_number,customer_id,status,notes,total_price,estimated_completion) values
('20000000-0000-0000-0000-000000000001','MZT-202607-1001','10000000-0000-0000-0000-000000000001','received','Kemeja formal warna hijau.',450000,'2026-07-27'),
('20000000-0000-0000-0000-000000000002','MZT-202607-1002','10000000-0000-0000-0000-000000000001','received','Celana bahan untuk acara keluarga.',300000,'2026-07-29'),
('20000000-0000-0000-0000-000000000003','MZT-202607-1003','10000000-0000-0000-0000-000000000002','received','Kemeja linen lengan panjang.',375000,'2026-07-25'),
('20000000-0000-0000-0000-000000000004','MZT-202607-1004','10000000-0000-0000-0000-000000000002','received','Permak dua celana.',120000,'2026-07-23'),
('20000000-0000-0000-0000-000000000005','MZT-202607-1005','10000000-0000-0000-0000-000000000003','received','Setelan untuk acara wisuda.',1250000,'2026-08-03'),
('20000000-0000-0000-0000-000000000006','MZT-202607-1006','10000000-0000-0000-0000-000000000003','received','Kemeja putih custom.',400000,'2026-07-30'),
('20000000-0000-0000-0000-000000000007','MZT-202607-1007','10000000-0000-0000-0000-000000000003','received','Baju koko hijau.',500000,'2026-08-05'),
('20000000-0000-0000-0000-000000000008','MZT-202607-1008','10000000-0000-0000-0000-000000000003','received','Jas formal custom.',1800000,'2026-08-12'),
('20000000-0000-0000-0000-000000000009','MZT-202607-1009','10000000-0000-0000-0000-000000000003','received','Kemeja batik modern.',475000,'2026-08-18'),
('20000000-0000-0000-0000-000000000010','MZT-202607-1010','10000000-0000-0000-0000-000000000004','received','Kemeja koko untuk acara keluarga.',525000,'2026-07-24')
on conflict (id) do nothing;

insert into public.order_items(id,order_id,clothing_type,model,quantity,unit_price) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Kemeja','Kemeja formal slim fit',2,225000),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Celana','Celana bahan straight',2,150000),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Kemeja','Kemeja linen relaxed',1,375000),
('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','Permak','Potong panjang celana',2,60000),
('30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005','Jas','Setelan jas two-piece',1,1250000),
('30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000006','Kemeja','Kemeja putih oxford',1,400000),
('30000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000007','Baju koko','Koko bordir modern',1,500000),
('30000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000008','Jas','Jas formal single breasted',1,1800000),
('30000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000009','Kemeja','Batik modern slim fit',1,475000),
('30000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000010','Baju koko','Koko keluarga',1,525000)
on conflict (id) do nothing;

-- Progress examples: Budi gets two stamps, Raka one, Andi five, Dimas has a ready order.
update public.orders set status='completed' where id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000009');
update public.orders set status='in_progress' where id='20000000-0000-0000-0000-000000000004';
update public.orders set status='ready' where id='20000000-0000-0000-0000-000000000010';


-- The first Auth user is the only automatic admin; later signups are staff.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','staff'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,role)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),
    case when not exists(select 1 from public.profiles where role='admin') then 'admin' else 'staff' end
  );
  return new;
end; $$;


-- Public ordering is disabled to prevent spam. Only authenticated admins can create orders.
revoke execute on function public.create_public_order(text,text,text,jsonb,text,jsonb) from anon;
grant execute on function public.create_public_order(text,text,text,jsonb,text,jsonb) to authenticated;

create or replace function public.create_public_order(
 p_name text,p_whatsapp text,p_address text,p_measurements jsonb,p_notes text,p_items jsonb
) returns text language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_order uuid; v_number text; v_seq integer; v_month text; v_item jsonb;
begin
 if not public.is_admin() then raise exception 'Akses ditolak'; end if;
 if length(trim(p_name))<2 or length(regexp_replace(p_whatsapp,'\D','','g'))<9 or jsonb_array_length(p_items)<1 then raise exception 'Data pemesanan tidak lengkap'; end if;
 v_month=to_char(now(),'YYYYMM'); perform pg_advisory_xact_lock(hashtext('mzt-'||v_month));
 select coalesce(max(right(order_number,4)::integer),0)+1 into v_seq from public.orders where order_number like 'MZT-'||v_month||'-%';
 if v_seq>9999 then raise exception 'Kapasitas nomor pesanan bulan ini penuh'; end if;
 v_number='MZT-'||v_month||'-'||lpad(v_seq::text,4,'0');
 insert into public.customers(name,whatsapp,address) values(trim(p_name),trim(p_whatsapp),trim(p_address))
 on conflict(whatsapp) do update set name=excluded.name,address=excluded.address,updated_at=now() returning id into v_customer;
 if p_measurements is not null and p_measurements <> '{}'::jsonb and exists(select 1 from jsonb_each_text(p_measurements) where value<>'') then
   insert into public.customer_measurements(customer_id,label,measurements,notes) values(v_customer,'Ukuran dari '||v_number,p_measurements,'Dikirim melalui form pemesanan');
 end if;
 insert into public.orders(order_number,customer_id,notes) values(v_number,v_customer,p_notes) returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
   insert into public.order_items(order_id,clothing_type,model,quantity,reference_path) values(v_order,trim(v_item->>'clothing_type'),trim(v_item->>'model'),greatest(1,(v_item->>'quantity')::integer),nullif(v_item->>'reference_path',''));
 end loop;
 return v_number;
end; $$;


-- Form pemesanan publik sudah dinonaktifkan; foto referensi hanya boleh diunggah admin.
drop policy if exists "public uploads order references" on storage.objects;
drop policy if exists "admin uploads order references" on storage.objects;
create policy "admin uploads order references" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'order-references' and public.is_admin());


insert into public.business_settings(business_name,tagline,description,whatsapp,address,instagram,hours) values
('MZ TAILOR','Jahitan rapi, pas di hati.','Melayani jahit pakaian wanita dan pria, permak, serta seragam dengan pengerjaan teliti dan ukuran yang nyaman.','6281234567890','Jl. Melati No. 12, Indonesia','@mztailor','Seninâ€“Sabtu, 08.00â€“17.00');

insert into public.services(name,description,starting_price,icon,is_active,sort_order) values
('Jahit Custom','Pakaian dibuat khusus sesuai ukuran dan model pilihanmu.',150000,'scissors',true,1),
('Permak Pakaian','Perbaikan ukuran, resleting, panjang, dan detail lainnya.',30000,'ruler',true,2),
('Seragam','Pengerjaan seragam keluarga, sekolah, dan komunitas.',120000,'shirt',true,3);

insert into public.portfolios(title,description,image_url,category,is_active,sort_order) values
('Kemeja Hijau Modern','Potongan bersih dengan ukuran yang presisi.','/images/menswear-hero.png','Kemeja Pria',true,1),
('Setelan Linen Pria','Ringan, rapi, dan nyaman untuk acara istimewa.','/images/menswear-suit.png','Setelan Pria',true,2),
('Baju Koko Modern','Detail bordir lembut dengan siluet kontemporer.','/images/menswear-koko.png','Busana Pria',true,3);

insert into public.rewards(name,description,stamp_cost,stock,is_active) values
('Diskon Jasa Jahit','Potongan jasa jahit untuk satu pesanan berikutnya.',5,null,true),
('Gratis Permak Ringan','Gratis satu layanan permak ringan.',5,20,true);

