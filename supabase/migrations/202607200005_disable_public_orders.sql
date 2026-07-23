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
