"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface MemberRecord {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface InvitationRecord {
  id: string;
  company_id: string;
  invited_email: string;
  role: string;
  status: string;
  invited_by: string;
  created_at: string;
  updated_at: string;
  acceptance_token_expires_at?: string | null;
}

interface InvitationAcceptance {
  token: string;
  expires_at: string;
  onboarding_url: string;
}

interface FieldErrors {
  invited_email?: string;
  role?: string;
}

const ROLE_OPTIONS = ["owner", "staff", "read_only", "accountant", "auditor", "payroll_only", "sales_only", "integration_admin"] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function TeamAccessPanel() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [roleActionError, setRoleActionError] = useState<string | null>(null);
  const [roleActionMessage, setRoleActionMessage] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("staff");
  const [inviteFieldErrors, setInviteFieldErrors] = useState<FieldErrors>({});
  const [inviteActionError, setInviteActionError] = useState<string | null>(null);
  const [inviteActionMessage, setInviteActionMessage] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [latestAcceptance, setLatestAcceptance] = useState<InvitationAcceptance | null>(null);

  const sortedMembers = useMemo(() => [...members].sort((left, right) => left.created_at.localeCompare(right.created_at)), [members]);

  async function loadMembers() {
    setMembersLoading(true);
    setMembersError(null);

    const response = await fetch("/api/companies/members", { method: "GET", cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; members?: MemberRecord[] };

    if (!response.ok) {
      setMembers([]);
      setMembersLoading(false);
      setMembersError(payload.error ?? "Unable to load team members.");
      return;
    }

    const loadedMembers = Array.isArray(payload.members) ? payload.members : [];
    setMembers(loadedMembers);
    setPendingRoles(Object.fromEntries(loadedMembers.map((member) => [member.id, member.role])));
    setMembersLoading(false);
  }

  async function loadInvitations() {
    setInvitationsLoading(true);
    setInvitationsError(null);

    const response = await fetch("/api/companies/invitations", { method: "GET", cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; pending_invitations?: InvitationRecord[] };

    if (!response.ok) {
      setInvitations([]);
      setInvitationsLoading(false);
      setInvitationsError(payload.error ?? "Unable to load invitations.");
      return;
    }

    setInvitations(Array.isArray(payload.pending_invitations) ? payload.pending_invitations : []);
    setInvitationsLoading(false);
  }

  useEffect(() => {
    void Promise.all([loadMembers(), loadInvitations()]);
  }, []);

  function validateInviteForm() {
    const nextErrors: FieldErrors = {};
    const normalizedEmail = inviteEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.invited_email = "Email is required.";
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.invited_email = "Enter a valid email address.";
    }

    if (!inviteRole.trim()) {
      nextErrors.role = "Role is required.";
    }

    setInviteFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleMemberRoleSave(member: MemberRecord) {
    const nextRole = (pendingRoles[member.id] ?? member.role).trim();

    if (!nextRole) {
      setRoleActionError("Role is required.");
      setRoleActionMessage(null);
      return;
    }

    setUpdatingMemberId(member.id);
    setRoleActionError(null);
    setRoleActionMessage(null);

    const response = await fetch("/api/companies/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership_id: member.id, role: nextRole })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string; membership?: MemberRecord };

    if (!response.ok || !payload.membership) {
      setUpdatingMemberId(null);
      setRoleActionError(payload.error ?? "Unable to update role.");
      return;
    }

    const updatedMembership = payload.membership;
    setMembers((current) => current.map((entry) => (entry.id === updatedMembership.id ? updatedMembership : entry)));
    setPendingRoles((current) => ({ ...current, [member.id]: updatedMembership.role }));
    setRoleActionMessage("Role updated.");
    setUpdatingMemberId(null);
  }

  async function handleSendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateInviteForm()) {
      return;
    }

    setIsInviting(true);
    setInviteActionError(null);
    setInviteActionMessage(null);

    const response = await fetch("/api/companies/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invited_email: inviteEmail.trim().toLowerCase(), role: inviteRole.trim() })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      invitation?: InvitationRecord;
      acceptance?: InvitationAcceptance;
    };

    if (!response.ok || !payload.invitation) {
      setIsInviting(false);
      setInviteActionError(payload.error ?? "Unable to send invitation.");
      return;
    }

    const nextInvitation = payload.invitation;
    setInvitations((current) => [nextInvitation, ...current]);
    setLatestAcceptance(payload.acceptance ?? null);
    setInviteEmail("");
    setInviteRole("staff");
    setInviteFieldErrors({});
    setInviteActionMessage("Invitation sent.");
    setIsInviting(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-white">Team members</h3>
        <p className="mt-2 text-sm text-indigo-100/75">Review existing memberships and adjust roles when permitted.</p>

        {membersLoading ? <p className="mt-4 text-sm text-indigo-100/80">Loading members...</p> : null}
        {membersError ? <p className="mt-4 text-sm text-rose-200">{membersError}</p> : null}
        {roleActionError ? <p className="mt-3 text-sm text-rose-200">{roleActionError}</p> : null}
        {roleActionMessage ? <p className="mt-3 text-sm text-emerald-200">{roleActionMessage}</p> : null}

        {!membersLoading && !membersError && sortedMembers.length === 0 ? <p className="mt-4 text-sm text-indigo-100/80">No members found for this company yet.</p> : null}

        {!membersLoading && !membersError && sortedMembers.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {sortedMembers.map((member) => {
              const selectedRole = pendingRoles[member.id] ?? member.role;
              const hasChanges = selectedRole !== member.role;

              return (
                <li key={member.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),220px,120px] md:items-center">
                    <div>
                      <p className="text-sm font-medium text-white">User: {member.user_id}</p>
                      <p className="mt-1 text-xs text-indigo-100/70">Member since: {formatDate(member.created_at)}</p>
                    </div>

                    <label className="text-xs text-indigo-100/70" htmlFor={`role-${member.id}`}>
                      Role
                      <select
                        id={`role-${member.id}`}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-50"
                        value={selectedRole}
                        onChange={(event) => {
                          setPendingRoles((current) => ({ ...current, [member.id]: event.target.value }));
                          setRoleActionError(null);
                          setRoleActionMessage(null);
                        }}
                      >
                        {ROLE_OPTIONS.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {roleOption}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Button className="w-full" variant="secondary" disabled={!hasChanges || updatingMemberId === member.id} onClick={() => void handleMemberRoleSave(member)}>
                      {updatingMemberId === member.id ? "Saving..." : "Save role"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      <Card>
        <h3 className="font-semibold text-white">Invitations</h3>
        <p className="mt-2 text-sm text-indigo-100/75">Invite teammates to this company and assign an initial role.</p>
        <p className="mt-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-2 text-xs text-cyan-100">
          Invite links are one-time acceptance tokens with expiration. Share the onboarding link with the invited email owner.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSendInvite}>
          <div>
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(event) => {
                setInviteEmail(event.target.value);
                setInviteFieldErrors((current) => ({ ...current, invited_email: undefined }));
                setInviteActionError(null);
                setInviteActionMessage(null);
              }}
            />
            {inviteFieldErrors.invited_email ? <p className="mt-1 text-xs text-rose-200">{inviteFieldErrors.invited_email}</p> : null}
          </div>

          <div>
            <label className="text-xs text-indigo-100/70" htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-50"
              value={inviteRole}
              onChange={(event) => {
                setInviteRole(event.target.value);
                setInviteFieldErrors((current) => ({ ...current, role: undefined }));
                setInviteActionError(null);
                setInviteActionMessage(null);
              }}
            >
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
            {inviteFieldErrors.role ? <p className="mt-1 text-xs text-rose-200">{inviteFieldErrors.role}</p> : null}
          </div>

          <Button type="submit" disabled={isInviting}>
            {isInviting ? "Sending invite..." : "Send invite"}
          </Button>
          {inviteActionError ? <p className="text-sm text-rose-200">{inviteActionError}</p> : null}
          {inviteActionMessage ? <p className="text-sm text-emerald-200">{inviteActionMessage}</p> : null}
        </form>

        {latestAcceptance ? (
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-xs text-emerald-100">
            <p className="font-medium">Latest invite link</p>
            <p className="mt-1 break-all">{latestAcceptance.onboarding_url}</p>
            <p className="mt-1">Expires: {formatDate(latestAcceptance.expires_at)}</p>
          </div>
        ) : null}

        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="font-medium text-white">Pending invitations</h4>

          {invitationsLoading ? <p className="mt-3 text-sm text-indigo-100/80">Loading invitations...</p> : null}
          {invitationsError ? <p className="mt-3 text-sm text-rose-200">{invitationsError}</p> : null}

          {!invitationsLoading && !invitationsError && invitations.length === 0 ? <p className="mt-3 text-sm text-indigo-100/80">No pending invitations.</p> : null}

          {!invitationsLoading && !invitationsError && invitations.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-sm text-white">{invitation.invited_email}</p>
                  <p className="mt-1 text-xs text-indigo-100/70">Role: {invitation.role}</p>
                  <p className="mt-1 text-xs text-indigo-100/60">Invited: {formatDate(invitation.created_at)}</p>
                  <p className="mt-1 text-xs text-indigo-100/60">Expires: {formatDate(invitation.acceptance_token_expires_at)}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
