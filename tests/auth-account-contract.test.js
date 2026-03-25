const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('auth routes include signup/login/logout/reset/verification handlers', () => {
  const signup = read('src/app/api/auth/signup/route.ts');
  const login = read('src/app/api/auth/login/route.ts');
  const logout = read('src/app/api/auth/logout/route.ts');
  const forgot = read('src/app/api/auth/forgot-password/route.ts');
  const reset = read('src/app/api/auth/reset-password/route.ts');
  const resend = read('src/app/api/auth/resend-verification/route.ts');

  assert.match(signup, /signUp\(/);
  assert.match(login, /signInWithPassword\(/);
  assert.match(logout, /signOut\(/);
  assert.match(forgot, /resetPasswordForEmail\(/);
  assert.match(reset, /updateUser\(\{ password \}\)/);
  assert.match(resend, /auth\.resend\(/);
});

test('account page renders required profile and security sections', () => {
  const accountPanel = read('src/components/settings/account-security-panel.tsx');
  assert.match(accountPanel, /Account profile/);
  assert.match(accountPanel, /Security status/);
  assert.match(accountPanel, /Active sessions/);
  assert.match(accountPanel, /Last login/);
  assert.match(accountPanel, /MFA status/);
  assert.match(accountPanel, /Resend verification email/);
});

test('MFA and session/device/login-alert APIs are present', () => {
  const account = read('src/app/api/me/account/route.ts');
  const devices = read('src/app/api/me/devices/route.ts');
  const alerts = read('src/app/api/me/login-alerts/route.ts');
  const mfa = read('src/app/api/me/mfa/route.ts');

  assert.match(account, /last_sign_in_at/);
  assert.match(devices, /toDeviceHistory/);
  assert.match(alerts, /toLoginAlerts/);
  assert.match(mfa, /mfa\.listFactors/);
});
