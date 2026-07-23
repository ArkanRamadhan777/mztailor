# MZ TAILOR

Aplikasi full-stack sistem informasi usaha jahit berbasis React, TypeScript, dan Supabase. Pelanggan melihat informasi usaha dan berkonsultasi melalui WhatsApp; admin mengelola pesanan, pelanggan, ukuran, katalog, layanan, loyalitas, reward, dan pengaturan usaha melalui dashboard terproteksi.

## Fitur

- Landing page responsif: profil, layanan, katalog, keunggulan, alur pesan, loyalitas, FAQ, dan WhatsApp.
- Pesanan dibuat dari dashboard admin; halaman publik hanya menyediakan konsultasi WhatsApp untuk mencegah spam.
- Nomor otomatis `MZT-YYYYMM-XXXX` dibuat secara aman di database.
- Supabase Auth email/password dan route guard untuk seluruh `/mz-admin/*`.
- Status pesanan lengkap, riwayat status, harga, estimasi, dan pesan WhatsApp siap kirim.
- Loyalitas berbasis trigger database: satu pesanan selesai = satu stempel, unik per pesanan, reward aktif pada stempel kelima, dan reset saat ditukar.
- RLS untuk seluruh tabel serta policy Storage untuk katalog dan foto referensi.
- Loading, error, empty state, toast, dan modal konfirmasi.

## Teknologi

React 19, Vite, TypeScript, Tailwind CSS 4, Supabase, React Router, React Hook Form, Zod, Lucide React, dan Sonner.

## Menjalankan lokal

Prasyarat: Node.js 20+ dan proyek Supabase.

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```env
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_KEY
```

Terapkan database menggunakan Supabase CLI:

```bash
npx supabase link --project-ref PROJECT_REF
npx supabase db push
npx supabase db seed
```

Cara paling cepat: buka **Supabase Dashboard → SQL Editor → New query**, buka [supabase/setup.sql](<E:/MZ TAILOR!/supabase/setup.sql>), copy seluruh isinya, paste sekali, lalu klik **Run**. File tersebut sudah berisi schema, RLS, storage policy, trigger loyalitas, katalog pria, dan seed data.

Untuk migrasi bertahap melalui CLI, gunakan:

```bash
npx supabase link --project-ref PROJECT_REF
npx supabase db push
npx supabase db seed
```

Buat akun admin pertama melalui **Supabase Dashboard → Authentication → Users → Add user**. Trigger migration otomatis membuat user Auth pertama sebagai `profiles.role = admin`; user Auth berikutnya dicatat sebagai `staff` dan tidak dapat membuka dashboard admin. Setelah itu:

```bash
npm run dev
```

- Landing: `http://localhost:5173/`
- Pemesanan dikelola admin melalui menu **Pesanan** setelah login.
- Login admin: `http://localhost:5173/mz-admin/login`

URL login admin sengaja tidak ditampilkan di area publik.

## Perintah kualitas

```bash
npm run lint
npm run typecheck
npm run build
```

## Catatan keamanan

- Browser hanya menggunakan anon key; jangan pernah memasukkan service-role key ke `.env` frontend.
- Publik hanya dapat membaca layanan aktif, katalog aktif, dan profil usaha.
- Pembuatan customer/order dilakukan lewat RPC `security definer` yang hanya dapat dipanggil admin dan memvalidasi input. Tabel customer, ukuran, pesanan, harga, stempel, reward, dan log tidak dapat dibaca publik.
- Bucket `order-references` bersifat privat. Hanya admin yang dapat mengunggah/membaca berkas dengan batas 5 MB.
- Bucket `portfolio` bersifat publik karena gambar tampil di landing page, tetapi hanya admin yang dapat mengubah isinya.

## Struktur penting

```text
src/
  components/        UI publik, route guard, dan layout admin
  contexts/          session Supabase Auth
  hooks/             query reusable
  lib/               Supabase client dan utilitas
  pages/             halaman publik dan dashboard admin
supabase/
  migrations/        schema, fungsi, trigger, RLS, dan storage policy
  seed.sql            profil usaha, layanan, katalog, dan reward awal
```

Sebelum production, ganti nomor WhatsApp, alamat, gambar katalog seed, dan data usaha melalui halaman **Pengaturan**.

Untuk preview dashboard tanpa input manual, `supabase/setup.sql` juga menyertakan data dummy empat pelanggan, ukuran, sepuluh pesanan, item pesanan, progres status, dan riwayat loyalitas.

Jika database sudah pernah dibuat sebelum pengamanan pemesanan publik diterapkan, jalankan migration `supabase/migrations/202607200005_disable_public_orders.sql` sekali di Supabase SQL Editor.

Jika schema sudah pernah dijalankan dan muncul error `type "order_status" already exists`, jangan jalankan `setup.sql` lagi. Jalankan hanya [supabase/dummy-data.sql](<E:/MZ TAILOR!/supabase/dummy-data.sql>) untuk menambahkan data demo ke database yang sudah ada.

Jika database sudah ada tetapi belum menerima pengamanan terbaru, jalankan [supabase/repair-existing.sql](<E:/MZ TAILOR!/supabase/repair-existing.sql>) sekali. File ini memperbarui akses pembuatan pesanan, policy upload, dan aturan admin/staff tanpa membuat ulang tabel.

Untuk langsung memasang perubahan pesanan terbaru sekaligus data demo, gunakan [supabase/demo-data-and-reward.sql](<E:/MZ TAILOR!/supabase/demo-data-and-reward.sql>). File ini menambahkan ukuran per item, kalkulasi subtotal/diskon, RPC order baru, dua reward diskon, dan pelanggan demo **Andi Wijaya** dengan 5 stempel serta 1 reward aktif.

## Computational thinking dan validasi hasil

- **Decomposition:** landing/marketing, autentikasi admin, pelanggan & ukuran, pesanan multi-item, status, katalog, layanan, loyalitas, reward, dan WhatsApp dipisahkan menjadi modul.
- **Pattern recognition:** perubahan status selalu dicatat ke riwayat; setiap pesanan selesai hanya menghasilkan satu stempel; nomor pesanan konsisten `MZT-YYYYMM-XXXX`.
- **Abstraction:** status, label, warna, dan aturan reward dipusatkan di tipe/utilitas sehingga UI tidak menggandakan logika bisnis.
- **Algorithm:** guard admin → input pesanan → nomor otomatis → status → stempel selesai → reward 5 stempel → redeem dan reset stempel.

Checklist sebelum demo:

1. Login akun pertama berhasil; akun berikutnya berstatus staff dan ditolak route admin.
2. Admin dapat membuat pesanan dengan beberapa item, mengubah status, dan membuka WhatsApp dengan pesan terisi.
3. Status selesai memberi satu stempel; perubahan ulang tidak menggandakan stempel.
4. Reward dapat ditebus sebagai item; stok berkurang dan stempel aktif kembali nol.
5. Sesi anon hanya dapat membaca layanan, katalog, dan profil usaha; data pelanggan/pesanan tetap tertutup.
#
