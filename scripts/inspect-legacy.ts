import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const arg=process.argv.find(a=>a.startsWith('--file='))?.slice(7) ?? process.argv[process.argv.indexOf('--file')+1] ?? '';
if(!arg){console.error('Usage: pnpm legacy:inspect -- --file=/absolute/path/to/data.db');process.exit(1)}
const r=spawnSync('python3',[resolve('scripts/legacy_sqlite.py'),resolve(arg)],{stdio:'inherit'});process.exit(r.status??1);
