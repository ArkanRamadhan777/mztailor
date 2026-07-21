-- ============================================================
-- SOURCE: supabase\migrations\202607200003_dummy_data.sql
-- ============================================================

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

-- ============================================================
-- SOURCE: supabase\migrations\202607200004_single_admin_signup_policy.sql
-- ============================================================

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

