const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('receipts upload allows expected MIME types and blocks unsupported types', () => {
  const route = read('src/app/api/receipts/route.ts');

  assert.match(route, /ALLOWED_RECEIPT_MIME_TYPES = new Set\(\[/);
  assert.match(route, /"application\/pdf"/);
  assert.match(route, /"image\/jpeg"/);
  assert.match(route, /"image\/png"/);
  assert.match(route, /"image\/webp"/);

  assert.match(route, /if \(!ALLOWED_RECEIPT_MIME_TYPES\.has\(file\.type\)\)/);
  assert.match(route, /receipt_file_type_not_allowed/);
  assert.match(route, /Unsupported file type/);
});

test('receipts upload enforces max-size limit and deterministic 4xx response codes', () => {
  const route = read('src/app/api/receipts/route.ts');

  assert.match(route, /const MAX_RECEIPT_FILE_SIZE_BYTES = 10 \* 1024 \* 1024;/);
  assert.match(route, /if \(file\.size > MAX_RECEIPT_FILE_SIZE_BYTES\)/);
  assert.match(route, /receipt_file_too_large/);
  assert.match(route, /File exceeds max size limit/);

  assert.match(route, /buildValidationError\("receipt_file_missing", "Missing file"\)/);
  assert.match(route, /buildValidationError\("receipt_filename_invalid", "Unsafe filename"\)/);
  assert.match(route, /NextResponse\.json\(\{ error: message, code \}, \{ status: 400 \}\)/);
});

test('receipt storage path generation rejects unsafe filenames and normalizes object keys', () => {
  const route = read('src/app/api/receipts/route.ts');

  assert.match(route, /function isUnsafeFilename\(fileName: string\)/);
  assert.match(route, /INVALID_FILENAME_PATTERN = \/\[\\\\\/\\u0000-\\u001f\\u007f\]\|\\.\\.\//);
  assert.match(route, /const SAFE_FILENAME_PATTERN = \/\^\[a-zA-Z0-9\._-\]\+\$\//);

  assert.match(route, /const objectName = extension \? `\$\{crypto\.randomUUID\(\)\}\.\$\{extension\}` : crypto\.randomUUID\(\);/);
  assert.match(route, /return `\$\{params\.userId\}\/\$\{params\.companyId\}\/\$\{objectName\}`;/);
  assert.doesNotMatch(route, /Date\.now\(\)-\$\{file\.name\}/);
});
