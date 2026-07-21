insert into public.business_settings(business_name,tagline,description,whatsapp,address,instagram,hours) values
('MZ TAILOR','Jahitan rapi, pas di hati.','Melayani jahit pakaian wanita dan pria, permak, serta seragam dengan pengerjaan teliti dan ukuran yang nyaman.','6281234567890','Jl. Melati No. 12, Indonesia','@mztailor','Senin–Sabtu, 08.00–17.00');

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
