import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');
const migrationOrderPath = path.resolve('supabase/migrations/MIGRATION_ORDER.md');

const migrationFiles = (await readdir(migrationsDir))
  .filter((file) => /^\d+_.+\.sql$/u.test(file))
  .sort((a, b) => a.localeCompare(b));

const migrationOrderContent = await readFile(migrationOrderPath, 'utf8');
const documentedFiles = Array.from(
  migrationOrderContent.matchAll(/`(\d+_[^`]+\.sql)`/gu),
  (match) => match[1],
);

const documentedUnique = [...new Set(documentedFiles)].sort((a, b) => a.localeCompare(b));

const missingFromDoc = migrationFiles.filter((file) => !documentedUnique.includes(file));
const extraInDoc = documentedUnique.filter((file) => !migrationFiles.includes(file));

if (missingFromDoc.length === 0 && extraInDoc.length === 0) {
  console.log(
    `Migration order documentation is complete: ${migrationFiles.length} SQL migration files are listed.`,
  );
  process.exit(0);
}

if (missingFromDoc.length > 0) {
  console.error('Missing from supabase/migrations/MIGRATION_ORDER.md:');
  for (const file of missingFromDoc) {
    console.error(`- ${file}`);
  }
}

if (extraInDoc.length > 0) {
  console.error('Documented but not found in supabase/migrations/:');
  for (const file of extraInDoc) {
    console.error(`- ${file}`);
  }
}

process.exit(1);
