import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

// Chi nap file env danh rieng cho test, khong doc `.env` cua moi truong dev
// de test khong vo tinh dung nham DB/secret that. File sau ghi de file truoc.
const TEST_ENV_FILES = ['.env.test', '.env.test.local'];

export function loadTestEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const file of TEST_ENV_FILES) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      Object.assign(env, parse(readFileSync(fullPath)));
    }
  }
  return env;
}
