#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';

function run(command, options = {}) {
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

function readSupabaseEnv() {
  const raw = execSync('supabase status -o env', { encoding: 'utf8' });
  const env = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('export ')) continue;

    const match = /^export\s+([A-Z0-9_]+)=(.*)$/.exec(trimmed);
    if (!match) continue;

    const [, key, value] = match;
    env[key] = value.replace(/^"|"$/g, '');
  }

  if (!env.SUPABASE_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) {
    throw new Error('Could not parse expected keys from `supabase status -o env`.');
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY
  };
}

let started = false;

try {
  run('supabase start');
  started = true;
  run('supabase db reset --local --yes');

  const integrationEnv = {
    ...process.env,
    ...readSupabaseEnv()
  };

  run('node --test tests/integration/*.test.js', { env: integrationEnv });
} finally {
  if (started) {
    try {
      run('supabase stop');
    } catch {
      // Best effort cleanup.
    }
  }
}
