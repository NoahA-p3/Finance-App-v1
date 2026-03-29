import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');
const migrationOrderPath = path.resolve('supabase/migrations/MIGRATION_ORDER.md');
const rollbackNotesMarker = '-- Rollback / recovery notes:';

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

const migrationsMissingRollbackNotes = [];

for (const file of migrationFiles) {
  const migrationPath = path.join(migrationsDir, file);
  const content = await readFile(migrationPath, 'utf8');

  if (!content.includes(rollbackNotesMarker)) {
    migrationsMissingRollbackNotes.push(file);
  }
}

if (
  missingFromDoc.length === 0
  && extraInDoc.length === 0
  && migrationsMissingRollbackNotes.length === 0
) {
  console.log(
    `Migration checks passed: ${migrationFiles.length} SQL migration files are listed in MIGRATION_ORDER.md and include rollback notes.`,
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

if (migrationsMissingRollbackNotes.length > 0) {
  console.error(`Missing rollback marker "${rollbackNotesMarker}" in migration SQL files:`);
  for (const file of migrationsMissingRollbackNotes) {
    console.error(`- ${file}`);
  }
}

process.exit(1);
