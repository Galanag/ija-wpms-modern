#!/usr/bin/env python3
import argparse, json, sqlite3, pathlib
p=argparse.ArgumentParser();p.add_argument('--file',required=True);a=p.parse_args()
con=sqlite3.connect(a.file); con.row_factory=sqlite3.Row
rows=con.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name").fetchall()
out=[]
for r in rows:
    name=r['name']; cols=[dict(x) for x in con.execute(f'pragma table_info("{name}")').fetchall()]
    cnt=con.execute(f'select count(*) as c from "{name}"').fetchone()['c']; out.append({'table':name,'columns':cols,'count':cnt})
print(json.dumps({'source':str(pathlib.Path(a.file).resolve()),'tables':out},indent=2))
