import { createHash, randomBytes } from "node:crypto";

const INVITATION_TTL_HOURS = 24 * 7;

export interface InvitationTokenBundle {
  token: string;
  tokenHash: string;
  expiresAt: string;
}

export function createInvitationToken(): InvitationTokenBundle {
  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  return { token, tokenHash, expiresAt };
}
