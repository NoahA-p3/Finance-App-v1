import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve('.');

const runtimePathPrefixes = ['src/app/', 'src/lib/'];
const allowlistedLegacyPathPrefixes = ['docs/', 'supabase/migrations/'];
const ignoredPathPrefixes = [
  '.git/',
  '.next/',
  'node_modules/',
  'archive/',
  'out/',
  'dist/',
  'coverage/',
];

const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.sql',
  '.md',
  '.mdx',
  '.txt',
  '.yml',
  '.yaml',
]);

const bannedLegacyReferences = [
  { label: 'legacy table public.users', pattern: /\bpublic\.users\b/gu },
  { label: 'legacy table public.accounts', pattern: /\bpublic\.accounts\b/gu },
  { label: 'legacy-only column transactions.account_id', pattern: /\btransactions\.account_id\b/gu },
  { label: 'legacy-only column receipts.file_url', pattern: /\breceipts\.file_url\b/gu },
];

const bypassEnvVar = 'ALLOW_LEGACY_RUNTIME_REFERENCES';
if (process.env[bypassEnvVar] === '1') {
  console.warn(
    `Bypassing legacy runtime reference check because ${bypassEnvVar}=1. Use only for explicit legacy-support work.`,
  );
  process.exit(0);
}

function normalizeRelativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function shouldIgnorePath(relativePath) {
  return ignoredPathPrefixes.some((prefix) => relativePath.startsWith(prefix));
}

async function collectFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = normalizeRelativePath(fullPath);

    if (shouldIgnorePath(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function isRuntimeFile(relativePath) {
  return runtimePathPrefixes.some((prefix) => relativePath.startsWith(prefix));
}

function isAllowlistedLegacyFile(relativePath) {
  return allowlistedLegacyPathPrefixes.some((prefix) => relativePath.startsWith(prefix));
}

function getLineFromIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

const files = await collectFiles(repoRoot);
const violations = [];
const allowlistedMatches = [];

for (const filePath of files) {
  const relativePath = normalizeRelativePath(filePath);
  const content = await readFile(filePath, 'utf8');

  for (const { label, pattern } of bannedLegacyReferences) {
    pattern.lastIndex = 0;

    for (const match of content.matchAll(pattern)) {
      const line = getLineFromIndex(content, match.index ?? 0);
      const details = {
        file: relativePath,
        line,
        reference: match[0],
        label,
      };

      if (isRuntimeFile(relativePath)) {
        violations.push(details);
        continue;
      }

      if (isAllowlistedLegacyFile(relativePath)) {
        allowlistedMatches.push(details);
      }
    }
  }
}

if (violations.length === 0) {
  const allowlistedSummary = allowlistedMatches.length > 0
    ? ` Found ${allowlistedMatches.length} allowlisted legacy reference match(es) in docs/migrations.`
    : '';

  console.log(
    `Legacy runtime reference check passed: no banned legacy references were found under ${runtimePathPrefixes.join(', ')}.${allowlistedSummary}`,
  );
  process.exit(0);
}

console.error('Legacy runtime reference check failed. Banned references were found in runtime app code:');
for (const violation of violations) {
  console.error(
    `- ${violation.file}:${violation.line} -> ${violation.label} (${violation.reference})`,
  );
}

console.error('');
console.error('If this change is intentional legacy-support work, set ALLOW_LEGACY_RUNTIME_REFERENCES=1 in CI for that run and document why in the PR.');

process.exit(1);
