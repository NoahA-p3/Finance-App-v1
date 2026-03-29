-- Invitation acceptance lifecycle (additive).
-- Adds secure acceptance token metadata and a single idempotent acceptance function.

alter table public.company_invitations
  add column if not exists acceptance_token_hash text,
  add column if not exists acceptance_token_expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_by uuid references auth.users(id) on delete restrict,
  add column if not exists expired_at timestamptz,
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references auth.users(id) on delete restrict;

alter table public.company_invitations
  add constraint company_invitations_acceptance_token_hash_check
  check (acceptance_token_hash is null or char_length(acceptance_token_hash) >= 32);

create unique index if not exists company_invitations_token_hash_unique_idx
  on public.company_invitations (acceptance_token_hash)
  where acceptance_token_hash is not null;

create index if not exists company_invitations_token_expiry_idx
  on public.company_invitations (acceptance_token_expires_at)
  where status = 'pending';

create or replace function public.accept_company_invitation(p_token text)
returns table (
  result text,
  invitation_id uuid,
  company_id uuid,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_token_hash text := encode(digest(coalesce(trim(p_token), ''), 'sha256'), 'hex');
  v_invitation public.company_invitations%rowtype;
  v_membership public.company_memberships%rowtype;
begin
  if v_user_id is null then
    return query select 'unauthorized'::text, null::uuid, null::uuid, null::text, null::text;
    return;
  end if;

  if char_length(coalesce(trim(p_token), '')) < 16 then
    return query select 'invalid_token'::text, null::uuid, null::uuid, null::text, null::text;
    return;
  end if;

  select *
  into v_invitation
  from public.company_invitations ci
  where ci.acceptance_token_hash = v_token_hash
  limit 1;

  if not found then
    return query select 'invalid_token'::text, null::uuid, null::uuid, null::text, null::text;
    return;
  end if;

  if v_invitation.status = 'revoked' then
    return query select 'status_invalid'::text, v_invitation.id, v_invitation.company_id, v_invitation.role, v_invitation.status;
    return;
  end if;

  if v_invitation.status = 'accepted' then
    if v_invitation.accepted_by = v_user_id then
      return query select 'already_accepted'::text, v_invitation.id, v_invitation.company_id, v_invitation.role, v_invitation.status;
    else
      return query select 'forbidden'::text, v_invitation.id, v_invitation.company_id, v_invitation.role, v_invitation.status;
    end if;
    return;
  end if;

  if v_invitation.status <> 'pending' then
    return query select 'status_invalid'::text, v_invitation.id, v_invitation.company_id, v_invitation.role, v_invitation.status;
    return;
  end if;

  if v_invitation.acceptance_token_expires_at is not null and v_invitation.acceptance_token_expires_at <= now() then
    update public.company_invitations
    set status = 'expired',
        expired_at = coalesce(expired_at, now()),
        status_updated_at = now(),
        status_updated_by = v_user_id
    where id = v_invitation.id
      and status = 'pending';

    return query select 'expired'::text, v_invitation.id, v_invitation.company_id, v_invitation.role, 'expired'::text;
    return;
  end if;

  if v_user_email = '' or lower(v_invitation.invited_email) <> v_user_email then
    return query select 'forbidden'::text, v_invitation.id, v_invitation.company_id, v_invitation.role, v_invitation.status;
    return;
  end if;

  select * into v_membership
  from public.company_memberships cm
  where cm.company_id = v_invitation.company_id
    and cm.user_id = v_user_id
  limit 1;

  if not found then
    insert into public.company_memberships (company_id, user_id, role)
    values (v_invitation.company_id, v_user_id, v_invitation.role)
    returning * into v_membership;
  end if;

  update public.company_invitations
  set status = 'accepted',
      accepted_at = coalesce(accepted_at, now()),
      accepted_by = coalesce(accepted_by, v_user_id),
      status_updated_at = now(),
      status_updated_by = v_user_id,
      updated_at = now()
  where id = v_invitation.id
    and status = 'pending';

  update public.profiles
  set active_company_id = v_invitation.company_id
  where id = v_user_id;

  return query select 'accepted'::text, v_invitation.id, v_invitation.company_id, v_membership.role, 'accepted'::text;
end;
$$;

revoke all on function public.accept_company_invitation(text) from public;
grant execute on function public.accept_company_invitation(text) to authenticated;

-- Rollback / recovery notes:
-- - Destructive rollback SQL:
--   drop function if exists public.accept_company_invitation(text);
--   drop index if exists company_invitations_token_expiry_idx;
--   drop index if exists company_invitations_token_hash_unique_idx;
--   alter table public.company_invitations
--     drop constraint if exists company_invitations_acceptance_token_hash_check,
--     drop column if exists acceptance_token_hash,
--     drop column if exists acceptance_token_expires_at,
--     drop column if exists accepted_at,
--     drop column if exists accepted_by,
--     drop column if exists expired_at,
--     drop column if exists status_updated_at,
--     drop column if exists status_updated_by;
-- - Recovery guidance:
--   1) Snapshot company_invitations + company_memberships before rollback.
--   2) If rollback was accidental, re-apply migration and restore snapshot.
--   3) Re-verify token acceptance behavior, status transitions, and active company switching.
