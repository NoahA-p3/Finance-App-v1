export function isPasswordResetEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET !== "false";
}

export function isSessionManagementEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_SESSION_MANAGEMENT !== "false";
}

export function isAdvancedRolesEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ROLES === "true";
}
