export function isPasswordResetEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET !== "false";
}
