-- Remove direct notification insert from update_kyc_status; rely on trigger notify_kyc_status_change
-- Safe change: preserves behavior and return shape, only eliminates duplicate notification writes.

begin;

create or replace function public.update_kyc_status(
  document_id uuid,
  user_id uuid,
  new_status text,
  admin_notes_param text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  begin
    -- Update the KYC document
    update kyc_documents
    set 
      status = new_status::kyc_status,
      admin_notes = admin_notes_param,
      updated_at = now()
    where id = document_id;
    
    -- Update the user's profile
    update profiles
    set 
      kyc_status = new_status::kyc_status,
      updated_at = now()
    where id = user_id;
    
    -- Verify both updates
    perform 1
    from kyc_documents
    where id = document_id and status = new_status::kyc_status;
    
    perform 1
    from profiles
    where id = user_id and kyc_status = new_status::kyc_status;
    
    if not found then
      raise exception 'Failed to update KYC statuses consistently';
    end if;

    -- IMPORTANT: Do NOT insert into notifications here.
    -- Notifications are handled by the AFTER UPDATE trigger on kyc_documents:
    --   trg_notify_kyc_status_change -> public.notify_kyc_status_change()

    -- Return success
    result := jsonb_build_object('success', true);
    return result;

  exception when others then
    result := jsonb_build_object(
      'success', false,
      'error', sqlerrm,
      'error_code', sqlstate,
      'document_id', document_id,
      'user_id', user_id,
      'new_status', new_status
    );
    return result;
  end;
end;
$$;

commit;
