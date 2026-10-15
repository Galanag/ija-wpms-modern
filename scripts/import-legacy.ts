import {spawnSync} from 'node:child_process';import {resolve} from 'node:path';import {PrismaClient} from '@prisma/client';
const file=process.argv.find(a=>a.startsWith('--file='))?.slice(7) ?? process.argv[process.argv.indexOf('--file')+1] ?? '';if(!file){console.error('Usage: pnpm legacy:import -- --file=/absolute/path/to/data.db');process.exit(1)}
const dump=spawnSync('python3',[resolve('scripts/legacy_dump.py'),resolve(file)],{encoding:'utf8'});if(dump.status!==0){console.error(dump.stderr);process.exit(dump.status??1)}
const payload=JSON.parse(dump.stdout);const db=new PrismaClient();
console.log(`Legacy source inspected: ${payload.tables.length} tables`);
console.log('Import scaffold is intentionally review-gated. Use scripts/legacy-map.ts to approve mappings before mutating PostgreSQL.');
await db.$disconnect();
