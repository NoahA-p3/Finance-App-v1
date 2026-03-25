export function isPasswordResetEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET !== "false";
}

export function isSessionManagementEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_SESSION_MANAGEMENT !== "false";
}

export function isAdvancedRolesEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ROLES === "true";
}

export function isEntitlementReadEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_ENTITLEMENTS !== "false";
}

export function isEntitlementEnforcementEnabledForPlan(planKey: string) {
  if (process.env.ENABLE_ENTITLEMENT_ENFORCEMENT === "false") {
    return false;
  }

  const planAllowListRaw = process.env.ENABLE_ENTITLEMENT_ENFORCEMENT_PLAN_KEYS;
  if (!planAllowListRaw || planAllowListRaw.trim().length === 0) {
    return true;
  }

  const planAllowList = new Set(
    planAllowListRaw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );

  return planAllowList.has(planKey.toLowerCase());
}
