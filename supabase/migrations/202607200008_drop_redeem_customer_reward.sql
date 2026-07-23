-- Hapus fungsi redeem reward standalone yang sudah digantikan oleh create_admin_order.
-- Reward sekarang hanya bisa dipakai saat membuat pesanan agar diskon bisa dikalkulasi
-- ke total pesanan oleh create_admin_order.
drop function if exists public.redeem_customer_reward(uuid,uuid);
