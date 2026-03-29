const requiredEnv = [
  'RUNTIME_TESTS_ENABLED',
  'RUNTIME_TEST_APP_BASE_URL',
  'RUNTIME_TEST_SUPABASE_URL',
  'RUNTIME_TEST_SUPABASE_ANON_KEY',
  'RUNTIME_TEST_SUPABASE_SERVICE_ROLE_KEY'
];

function missingRuntimeEnv() {
  return requiredEnv.filter((key) => !process.env[key] || process.env[key].trim() === '');
}

function runtimeTestsEnabled() {
  if (process.env.RUNTIME_TESTS_ENABLED !== '1') {
    return false;
  }

  return missingRuntimeEnv().length === 0;
}

module.exports = {
  missingRuntimeEnv,
  runtimeTestsEnabled
};
