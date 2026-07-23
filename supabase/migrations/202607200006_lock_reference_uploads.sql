-- Form pemesanan publik sudah dinonaktifkan; foto referensi hanya boleh diunggah admin.
drop policy if exists "public uploads order references" on storage.objects;
drop policy if exists "admin uploads order references" on storage.objects;
create policy "admin uploads order references" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'order-references' and public.is_admin());
