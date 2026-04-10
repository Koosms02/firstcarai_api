import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function normalizeValue(rawValue: string) {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = normalizeValue(line.slice(equalsIndex + 1));

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}
