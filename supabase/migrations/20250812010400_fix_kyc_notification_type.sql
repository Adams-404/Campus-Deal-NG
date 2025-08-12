-- Hotfix: adjust KYC notification type to satisfy existing check constraint
-- We switch v_type from 'kyc' to 'admin_action' to avoid violating notifications_type_check
-- Later we can expand the check constraint to include 'kyc' explicitly if desired.

begin;

create or replace function public.notify_kyc_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title   text;
  v_content text;
  -- NOTE: using 'admin_action' to satisfy existing notifications_type_check
  v_type    text := 'admin_action';
begin
  -- Only act when status actually changes and a user is associated
  if tg_op = 'UPDATE' and (old.status is distinct from new.status) and new.user_id is not null then
    if new.status = 'verified' then
      v_title   := 'KYC Verified';
      v_content := 'Your KYC verification has been approved. You now have full access to all features.';
    elsif new.status = 'rejected' then
      v_title   := 'KYC Rejected';
      v_content := 'Your KYC verification was rejected.' ||
                   coalesce(' Reason: ' || nullif(trim(new.admin_notes), ''), '');
    elsif new.status = 'processing' then
      v_title   := 'KYC In Review';
      v_content := 'Your KYC submission is being reviewed. We will notify you once it''s completed.';
    elsif new.status = 'pending' then
      v_title   := 'KYC Submitted';
      v_content := 'Your KYC submission is pending. We will start reviewing it shortly.';
    else
      v_title   := 'KYC Status Updated';
      v_content := 'Your KYC status was updated to ' || coalesce(new.status::text, 'unknown') || '.';
    end if;

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

  return new;
end;
$$;

commit;
