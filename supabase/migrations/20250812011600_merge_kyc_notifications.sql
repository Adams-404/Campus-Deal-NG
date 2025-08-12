-- Merge strategy: always keep a single notification per (user_id, document_id, status) in recent window
-- and compose unified content that includes admin notes when present.

begin;

create or replace function public.notify_kyc_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title    text;
  v_content  text;
  v_type     text := 'admin_action';
  v_exists   public.notifications%rowtype;
  v_reason   text := nullif(trim(new.admin_notes), '');
  v_status   text := coalesce(new.status::text, '');
begin
  if tg_op = 'UPDATE' and (old.status is distinct from new.status) and new.user_id is not null then
    -- Build standard title/content
    if new.status = 'verified' then
      v_title   := 'KYC Verification Approved';
      v_content := 'Your KYC verification has been approved. You now have full access to all features.';
    elsif new.status = 'rejected' then
      v_title   := 'KYC Verification Rejected';
      v_content := 'Your KYC verification was rejected.';
    elsif new.status = 'processing' then
      v_title   := 'KYC In Review';
      v_content := 'Your KYC submission is being reviewed. We will notify you once it''s completed.';
    elsif new.status = 'pending' then
      v_title   := 'KYC Submitted';
      v_content := 'Your KYC submission is pending. We will start reviewing it shortly.';
    else
      v_title   := 'KYC Status Updated';
      v_content := 'Your KYC status was updated to ' || v_status || '.';
    end if;

    if v_reason is not null then
      v_content := v_content || ' Reason: ' || v_reason;
    end if;

    -- Try to find an existing recent notification for this user + document + status
    select * into v_exists
    from public.notifications n
    where n.user_id = new.user_id
      and n.type = v_type
      and (n.metadata ->> 'document_id') = new.id
      and (n.metadata ->> 'status') = v_status
      and n.created_at >= now() - interval '30 minutes'
    order by n.created_at desc
    limit 1;

    if found then
      -- Update existing to unified title/content and enrich metadata
      update public.notifications
      set title = v_title,
          content = v_content,
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'document_id', new.id,
            'status', new.status,
            'updated_at', now(),
            'category', 'kyc'
          )
      where id = v_exists.id;

      -- Remove any other duplicates (same doc/status) in recent window except the one we just updated
      delete from public.notifications n2
      where n2.user_id = new.user_id
        and n2.type = v_type
        and (n2.metadata ->> 'document_id') = new.id
        and (n2.metadata ->> 'status') = v_status
        and n2.id <> v_exists.id
        and n2.created_at >= now() - interval '30 minutes';
    else
      -- Insert new unified notification
      insert into public.notifications (user_id, title, content, type, is_read, metadata)
      values (
        new.user_id,
        v_title,
        v_content,
        v_type,
        false,
        jsonb_build_object(
          'document_id', new.id,
          'status', new.status,
          'updated_at', now(),
          'category', 'kyc'
        )
      );
    end if;
  end if;

  return new;
end;
$$;

commit;
