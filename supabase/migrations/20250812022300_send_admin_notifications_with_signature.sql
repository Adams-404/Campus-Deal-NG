-- Extend send_admin_notifications to include sender admin signature metadata
-- Adds sender_admin_id arg, verifies admin, embeds admin name and avatar into metadata

create or replace function public.send_admin_notifications(
  user_ids uuid[],
  notif_title text,
  notif_content text,
  sender_admin_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_first text;
  admin_last text;
  admin_avatar text;
begin
  -- Verify the caller is an admin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'insufficient_privilege';
  end if;

  -- Verify the chosen sender is an admin as well
  if not exists (
    select 1 from public.user_roles
    where user_id = sender_admin_id and role = 'admin'
  ) then
    raise exception 'invalid_sender_admin';
  end if;

  -- Fetch sender profile fields
  select p.first_name, p.last_name, p.avatar_url
    into admin_first, admin_last, admin_avatar
  from public.profiles p
  where p.id = sender_admin_id;

  -- Insert one notification per user id with admin signature metadata
  insert into public.notifications (user_id, type, title, content, metadata)
  select uid, 'admin_action', notif_title, notif_content,
         jsonb_build_object(
           'category','admin_message',
           'admin_id', sender_admin_id,
           'admin_name', coalesce(admin_first,'') || ' ' || coalesce(admin_last,''),
           'admin_avatar_url', admin_avatar,
           'admin_badge', true
         )
  from unnest(user_ids) as uid;
end;
$$;

grant execute on function public.send_admin_notifications(uuid[], text, text, uuid) to authenticated;
