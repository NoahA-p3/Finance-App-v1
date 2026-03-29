const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('posting account mapping defines explicit expense and revenue contracts', () => {
  const mapping = read('src/lib/postings/account-mapping.ts');

  assert.match(mapping, /expense:\s*\{\s*debitAccountCode:\s*"operating_expense",\s*creditAccountCode:\s*"cash"\s*\}/s);
  assert.match(mapping, /revenue:\s*\{\s*debitAccountCode:\s*"cash",\s*creditAccountCode:\s*"operating_revenue"\s*\}/s);
  assert.match(mapping, /TRANSACTION_TYPE_FALLBACK_ALIASES/);
  assert.match(mapping, /income:\s*"revenue"/);
  assert.match(mapping, /cost:\s*"expense"/);
});

test('posting account mapping rejects unsupported or empty transaction types', () => {
  const mapping = read('src/lib/postings/account-mapping.ts');

  assert.match(mapping, /Transaction type is required for posting account mapping\./);
  assert.match(mapping, /No posting account mapping configured for transaction type:/);
});

test('posting service derives journal line accounts via mapping module', () => {
  const service = read('src/lib/postings/service.ts');

  assert.match(service, /import \{ deriveLineAccounts \} from "@\/lib\/postings\/account-mapping"/);
  assert.match(service, /const \{ debitAccountCode, creditAccountCode \} = deriveLineAccounts\(transaction\.type\);/);
  assert.doesNotMatch(service, /function deriveLineAccounts\(/);
});
