-- Create function to allow admins to send notifications to one or more users
-- The function enforces admin check using user_roles and auth.uid()
-- Notifications are inserted with type 'admin_action' and metadata category 'admin_message'

create or replace function public.send_admin_notifications(
  user_ids uuid[],
  notif_title text,
  notif_content text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify the caller is an admin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'insufficient_privilege';
  end if;

  -- Insert one notification per user id
  insert into public.notifications (user_id, type, title, content, metadata)
  select uid, 'admin_action', notif_title, notif_content,
         jsonb_build_object('category','admin_message')
  from unnest(user_ids) as uid;
end;
$$;

-- Allow authenticated users to call the function; internal admin check still applies
grant execute on function public.send_admin_notifications(uuid[], text, text) to authenticated;
