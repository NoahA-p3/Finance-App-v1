const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('cvr adapter keeps safe unconfigured fallback when env configuration is missing', () => {
  const adapter = read('src/lib/cvr/adapter.ts');

  assert.match(adapter, /if \(!provider \|\| !baseUrl \|\| !apiKey\) \{\s*return null;\s*\}/);
  assert.match(adapter, /return new UnconfiguredCvrAdapter\(\);/);
  assert.match(adapter, /provider: "not_configured"/);
  assert.match(adapter, /CVR provider integration is not configured\./);
});

test('cvr adapter contract maps provider outcomes to ok, not_found, and unavailable', () => {
  const adapter = read('src/lib/cvr/adapter.ts');

  assert.match(adapter, /if \(response\.status === 404\) \{[\s\S]*status: "not_found"/);
  assert.match(adapter, /return \{[\s\S]*status: "ok"[\s\S]*manual_entry_required: false[\s\S]*company/);
  assert.match(adapter, /private unavailable\(message: string\): CvrLookupResult \{[\s\S]*status: "unavailable"/);
  assert.match(adapter, /setTimeout\(\(\) => controller\.abort\(\), this\.config\.timeoutMs\)/);
});

test('cvr adapter does not expose raw provider errors in returned messages', () => {
  const adapter = read('src/lib/cvr/adapter.ts');

  assert.doesNotMatch(adapter, /error\.message/);
  assert.doesNotMatch(adapter, /JSON\.stringify\(error\)/);
  assert.match(adapter, /CVR lookup is temporarily unavailable\. Continue with manual company entry\./);
  assert.match(adapter, /CVR provider did not respond in time\. Continue with manual company entry\./);
});
