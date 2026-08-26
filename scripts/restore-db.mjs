import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const url = process.env.DATABASE_URL;
const fileArg = process.argv[2];
if (!url) throw new Error('DATABASE_URL is required.');
if (!fileArg) throw new Error('Usage: npm run restore:db -- backups/file.dump');
if (process.env.CONFIRM_RESTORE !== 'RESTORE') throw new Error('Set CONFIRM_RESTORE=RESTORE to allow destructive restore.');
const file = resolve(fileArg);
if (!existsSync(file)) throw new Error(`Backup file not found: ${file}`);
const result = spawnSync('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--dbname', url, file], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Restore completed. Run prisma migrate deploy before serving traffic.');
