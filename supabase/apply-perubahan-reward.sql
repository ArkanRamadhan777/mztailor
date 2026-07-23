-- MZ TAILOR - Hapus fungsi redeem reward standalone
-- Reward sekarang hanya bisa dipakai SAAT MEMBUAT PESANAN
-- (via create_admin_order di halaman Tambah Pesanan)
-- sehingga diskon bisa dikalkulasi ke total pesanan.
--
-- Jalankan file ini SEKALI di Supabase SQL Editor.

drop function if exists public.redeem_customer_reward(uuid,uuid);
