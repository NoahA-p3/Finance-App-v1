const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('receipts route enforces auth and active-company membership before read/write operations', () => {
  const route = read('src/app/api/receipts/route.ts');

  assert.match(route, /requireAuthenticatedApiUser/);
  assert.match(route, /Unauthorized/);
  assert.match(route, /No company membership found\./);
  assert.match(route, /status:\s*401/);
  assert.match(route, /status:\s*404/);

  assert.match(route, /\.select\("id,path,created_at,transaction_id"\)/);
  assert.match(route, /\.eq\("company_id", membership\.companyId\)/);
});

test('receipts upload boundary includes MIME, size, filename, and deterministic path constraints', () => {
  const route = read('src/app/api/receipts/route.ts');

  assert.match(route, /ALLOWED_RECEIPT_MIME_TYPES = new Set\(\[/);
  assert.match(route, /MAX_RECEIPT_FILE_SIZE_BYTES = 10 \* 1024 \* 1024/);
  assert.match(route, /isUnsafeFilename/);
  assert.match(route, /receipt_file_missing/);
  assert.match(route, /receipt_file_type_not_allowed/);
  assert.match(route, /receipt_file_too_large/);
  assert.match(route, /receipt_filename_invalid/);

  assert.match(route, /return `\$\{params\.userId\}\/\$\{params\.companyId\}\/\$\{objectName\}`;/);
  assert.match(route, /crypto\.randomUUID\(\)/);
  assert.doesNotMatch(route, /Date\.now\(\)/);
});

test('receipts insert payload remains narrow and server-derived', () => {
  const route = read('src/app/api/receipts/route.ts');

  assert.match(route, /\.insert\(\{ user_id: authContext\.user\.id, company_id: membership\.companyId, path: filePath \}\)/);
  assert.doesNotMatch(route, /\.insert\(\{[\s\S]*\.\.\./);
});
