export interface InvitationDeliveryRequest {
  companyId: string;
  invitationId: string;
  invitedEmail: string;
  role: string;
  token: string;
  expiresAt: string;
  origin: string;
}

export interface InvitationDeliveryResult {
  provider: string;
  status: "manual_display" | "queued" | "provider_unavailable";
  provider_available: boolean;
  acceptance: {
    token: string;
    expires_at: string;
    onboarding_url: string;
  } | null;
  message?: string;
}

export interface InvitationDeliveryAdapter {
  deliverInvitation(request: InvitationDeliveryRequest): Promise<InvitationDeliveryResult>;
}

class ManualDisplayInvitationDeliveryAdapter implements InvitationDeliveryAdapter {
  async deliverInvitation(request: InvitationDeliveryRequest): Promise<InvitationDeliveryResult> {
    const onboardingUrl = `${request.origin}/onboarding?invite=${encodeURIComponent(request.token)}`;

    return {
      provider: "manual_display",
      status: "manual_display",
      provider_available: true,
      acceptance: {
        token: request.token,
        expires_at: request.expiresAt,
        onboarding_url: onboardingUrl
      },
      message: "Invite delivery is app-mediated/manual in this environment."
    };
  }
}

export function getInvitationDeliveryAdapter(): InvitationDeliveryAdapter {
  return new ManualDisplayInvitationDeliveryAdapter();
}
