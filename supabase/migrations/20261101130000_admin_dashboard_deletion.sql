-- Client deletion follows the same booking/payment cascade as service deletion.
-- No records are deleted by this migration. Access remains subject to RLS.
begin;

alter table public.bookings drop constraint bookings_client_id_fkey;
alter table public.bookings add constraint bookings_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete cascade;

-- Explicit allowlist: no dynamic SQL and no privileged client in the browser.
-- SECURITY INVOKER retains each table's existing admin-only RLS policies.
create function public.admin_delete_record(p_entity text, p_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_deleted uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_id is null then raise exception 'INVALID_RECORD' using errcode = '22023'; end if;
  case p_entity
    when 'booking' then delete from public.bookings where id = p_id returning id into v_deleted;
    when 'client' then delete from public.clients where id = p_id returning id into v_deleted;
    when 'service' then delete from public.services where id = p_id returning id into v_deleted;
    when 'player' then delete from public.represented_players where id = p_id returning id into v_deleted;
    when 'testimonial' then delete from public.testimonials where id = p_id returning id into v_deleted;
    when 'enquiry' then delete from public.contact_enquiries where id = p_id returning id into v_deleted;
    when 'availability_rule' then delete from public.availability_rules where id = p_id returning id into v_deleted;
    when 'availability_exception' then delete from public.availability_exceptions where id = p_id returning id into v_deleted;
    else raise exception 'INVALID_ENTITY' using errcode = '22023';
  end case;
  if v_deleted is null then raise exception 'RECORD_NOT_FOUND' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.admin_delete_record(text,uuid) from public,anon;
grant execute on function public.admin_delete_record(text,uuid) to authenticated;

commit;
