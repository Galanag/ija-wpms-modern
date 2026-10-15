#!/usr/bin/env python3
import argparse, json, sqlite3
p=argparse.ArgumentParser();p.add_argument('--file',required=True);a=p.parse_args();con=sqlite3.connect(a.file);con.row_factory=sqlite3.Row
names=[r[0] for r in con.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name")]
print(json.dumps({'tables':[{'name':n,'rows':[dict(x) for x in con.execute(f'select * from "{n}"').fetchall()]} for n in names]}))
