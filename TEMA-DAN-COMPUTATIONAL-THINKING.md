# TEMA DAN COMPUTATIONAL THINKING PROJECT

## Sistem Informasi Usaha Jahit MZ TAILOR

## 1. Tema Project

MZ TAILOR adalah aplikasi web full-stack untuk membantu digitalisasi operasional usaha jahit. Aplikasi ini menyediakan halaman informasi usaha untuk pelanggan dan dashboard admin untuk mengelola pelanggan, ukuran, pesanan, katalog, layanan, loyalitas, reward, serta komunikasi WhatsApp.

Tema utama project:

> Digitalisasi manajemen usaha jahit melalui sistem informasi berbasis web yang rapi, aman, responsif, dan mudah digunakan.

## 2. Latar Belakang

Usaha jahit sering mengelola data pelanggan, ukuran badan, detail pakaian, harga, status pengerjaan, dan riwayat pesanan secara manual. Cara tersebut dapat menyebabkan data tercecer, kesalahan pencatatan, sulit mencari pesanan, dan pelanggan tidak memperoleh informasi usaha secara jelas.

MZ TAILOR dibuat untuk membantu admin menyimpan dan mengelola data tersebut dalam satu sistem terpusat. Pelanggan dapat melihat profil usaha, layanan, katalog hasil jahitan, FAQ, dan menghubungi usaha melalui WhatsApp. Pesanan dicatat oleh admin agar data lebih terkontrol dan terlindungi dari spam.

## 3. Tujuan Project

1. Menyediakan informasi usaha jahit secara online.
2. Membantu admin mengelola data pelanggan dan ukuran.
3. Membantu admin mencatat pesanan dengan beberapa item pakaian.
4. Memudahkan pemantauan status pengerjaan pesanan.
5. Mengurangi kesalahan pencatatan nomor pesanan dan riwayat status.
6. Menerapkan program loyalitas berbasis stempel.
7. Memudahkan admin mengirim pembaruan pesanan melalui WhatsApp.
8. Menjaga data pelanggan dan pesanan dengan autentikasi serta Row Level Security.

## 4. Ruang Lingkup Aplikasi

### Halaman publik

- Profil usaha MZ TAILOR.
- Daftar layanan aktif.
- Katalog hasil jahitan pria.
- Keunggulan usaha.
- Cara konsultasi dan pemesanan.
- Program loyalitas lima stempel.
- FAQ.
- Kontak WhatsApp.

Halaman publik tidak menyediakan form order terbuka. Pesanan dikelola admin melalui dashboard agar lebih aman dan mengurangi penyalahgunaan form.

### Dashboard admin

- Login admin dengan email dan password Supabase Auth.
- Dashboard ringkasan operasional.
- Pengelolaan pelanggan.
- Penyimpanan data ukuran pelanggan.
- Pengelolaan pesanan multi-item.
- Penentuan harga dan estimasi selesai.
- Perubahan status pesanan.
- Riwayat perubahan status.
- Pengelolaan katalog dan layanan.
- Pengelolaan stempel dan reward berbentuk item.
- Pengaturan informasi usaha.
- Tombol WhatsApp dengan pesan otomatis yang tetap dikirim manual oleh admin.

## 5. Alur Kerja Sistem

1. Admin login melalui URL khusus.
2. Sistem memeriksa session dan role admin.
3. Admin membuat atau memilih data pelanggan.
4. Admin memasukkan ukuran pelanggan bila diperlukan.
5. Admin menambahkan satu atau beberapa item pakaian.
6. Sistem membuat nomor pesanan dengan format `MZT-YYYYMM-XXXX`.
7. Admin menentukan harga, estimasi selesai, catatan, dan status.
8. Status pesanan diperbarui sesuai proses pengerjaan.
9. Setiap perubahan status disimpan ke riwayat.
10. Saat pesanan menjadi selesai, pelanggan memperoleh satu stempel.
11. Setelah lima stempel, pelanggan memperoleh satu reward item.
12. Saat reward digunakan, stempel aktif kembali menjadi nol dan riwayat tetap tersimpan.
13. Admin dapat membuka WhatsApp dengan pesan status yang sudah terisi.

## 6. Penerapan Computational Thinking

### A. Decomposition

Masalah besar dipecah menjadi bagian-bagian kecil agar mudah dibuat dan dikelola:

1. Modul halaman publik.
2. Modul autentikasi admin.
3. Modul route guard dan keamanan.
4. Modul pelanggan.
5. Modul ukuran pelanggan.
6. Modul pesanan dan item pesanan.
7. Modul status dan riwayat pesanan.
8. Modul katalog.
9. Modul layanan.
10. Modul loyalitas.
11. Modul reward.
12. Modul komunikasi WhatsApp.
13. Modul pengaturan usaha.
14. Modul database, RLS, storage, dan trigger Supabase.

Dengan decomposition, setiap fitur dapat dikembangkan, diuji, dan diperbaiki tanpa mengganggu seluruh sistem.

### B. Pattern Recognition

Beberapa pola yang ditemukan dalam proses usaha jahit:

- Setiap pesanan memiliki nomor unik.
- Satu pesanan dapat memiliki banyak item pakaian.
- Pesanan selalu memiliki status proses.
- Setiap perubahan status perlu dicatat.
- Pesanan selesai memberikan satu stempel.
- Satu pesanan tidak boleh memberikan stempel dua kali.
- Lima stempel mengaktifkan reward.
- Reward dapat digunakan satu kali dan mengurangi jumlah reward tersedia.
- Pesan WhatsApp memiliki pola berdasarkan nama pelanggan, nomor pesanan, dan status terbaru.

Pola tersebut digunakan untuk membuat aturan database, trigger, tipe status, dan komponen UI yang konsisten.

### C. Abstraction

Informasi yang tidak diperlukan pengguna disembunyikan di balik abstraksi sistem:

- Admin cukup memilih status, tanpa perlu mengubah data database secara langsung.
- Admin cukup mengisi item pesanan, sementara sistem menghitung total harga.
- Admin cukup menekan tombol WhatsApp, sementara sistem menyusun pesan.
- Sistem menyembunyikan detail RLS dan security definer dari pengguna.
- Label status teknis seperti `in_progress` ditampilkan sebagai “Sedang dikerjakan”.
- Data katalog dan layanan disajikan sebagai kartu visual yang mudah dipahami.

Abstraction membuat sistem lebih sederhana digunakan tanpa menghilangkan aturan bisnis di belakangnya.

### D. Algorithm Design

#### Algoritma autentikasi

1. Pengguna memasukkan email dan password.
2. Supabase Auth memvalidasi kredensial.
3. Sistem mengambil session pengguna.
4. Sistem memeriksa role pada tabel `profiles`.
5. Jika role admin, akses dashboard diberikan.
6. Jika bukan admin, akses ditolak dan pengguna dikembalikan ke login.

#### Algoritma pembuatan pesanan

1. Validasi nama, nomor WhatsApp, dan minimal satu item.
2. Cari pelanggan berdasarkan nomor WhatsApp.
3. Buat pelanggan baru atau perbarui data pelanggan yang sudah ada.
4. Ambil urutan nomor pesanan bulan berjalan.
5. Kunci proses sementara agar nomor tidak ganda.
6. Buat nomor `MZT-YYYYMM-XXXX`.
7. Simpan pesanan dan seluruh item.
8. Simpan data ukuran jika tersedia.

#### Algoritma loyalitas

1. Periksa perubahan status pesanan.
2. Jika status berubah menjadi selesai dan belum pernah diberi stempel, buat riwayat stempel.
3. Tambahkan satu stempel kepada pelanggan.
4. Jika jumlah sebelumnya empat, aktifkan satu reward.
5. Saat reward digunakan, validasi lima stempel dan ketersediaan stok.
6. Simpan riwayat redemption.
7. Kurangi reward tersedia dan reset stempel aktif menjadi nol.

## 7. Keamanan Sistem

- Seluruh halaman admin dilindungi route guard.
- Hanya role admin yang dapat mengakses data operasional.
- Akun Auth pertama otomatis menjadi admin; akun berikutnya menjadi staff.
- Row Level Security aktif pada tabel Supabase.
- Data pelanggan, ukuran, harga, pesanan, stempel, reward, dan log WhatsApp tidak dapat dibaca publik.
- RPC sensitif memvalidasi role admin.
- Bucket foto referensi bersifat privat dan hanya dapat diakses admin.
- Service role key tidak disimpan di frontend.
- URL login admin tidak ditampilkan pada landing page.
- Header keamanan dan redirect SPA disediakan untuk deployment.

## 8. Output Project

Output yang dihasilkan:

1. Source code React, Vite, TypeScript, dan Tailwind CSS.
2. Landing page responsif.
3. Login admin.
4. Dashboard admin tanpa sidebar desktop.
5. Halaman pelanggan, pesanan, katalog, layanan, loyalitas, reward, dan pengaturan.
6. Supabase migration dan file setup satu kali jalan.
7. RLS policy dan storage policy.
8. Seed data serta dummy data.
9. README instalasi.
10. Favicon MZ dan wordmark MZ TAILOR.
11. Loading state, error state, empty state, toast, dan modal konfirmasi.

## 9. Outcome

Outcome dari project ini adalah tersedianya sistem informasi usaha jahit yang dapat digunakan admin untuk mengelola operasional secara terstruktur. Data pelanggan, ukuran, pesanan, status, loyalitas, dan reward berada dalam satu sistem yang lebih mudah dicari dan diperbarui.

## 10. Output dan Impact

### Output

- Sistem web MZ TAILOR yang dapat dijalankan.
- Dashboard admin terproteksi.
- Database Supabase dengan aturan bisnis dan keamanan.
- Alur pesanan multi-item.
- Program loyalitas dan reward item.
- Pesan WhatsApp siap kirim.

### Impact

- Mengurangi pencatatan manual dan risiko data tercecer.
- Mempercepat pencarian pelanggan dan pesanan.
- Membantu admin memantau progres pengerjaan.
- Mengurangi kesalahan pemberian stempel.
- Meningkatkan konsistensi layanan kepada pelanggan.
- Membantu usaha terlihat lebih profesional secara digital.
- Menjaga informasi operasional agar tidak terbuka untuk publik.

## 11. Kesimpulan

MZ TAILOR menerapkan computational thinking dengan memecah masalah usaha jahit menjadi modul, mengenali pola proses pesanan dan loyalitas, menyederhanakan detail teknis melalui abstraksi, serta menerapkan algoritma yang konsisten di database dan antarmuka.

Project ini tidak hanya menghasilkan tampilan website, tetapi juga sistem operasional yang memiliki alur data, aturan bisnis, keamanan, dan dampak nyata bagi pengelolaan usaha jahit.
