import { mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required.');
const dir = resolve(process.env.BACKUP_DIR || 'backups');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = resolve(dir, `crm-${stamp}.dump`);
const result = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--file', file, url], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Backup created: ${file}`);
