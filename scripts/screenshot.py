"""Capture Herdr with explicit sample data, never terminals or the personal journal."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--terminal',action='store_true',help='Show a mock terminal instead of the expanded sample farm')
args=parser.parse_args()
home=Path(os.environ.get('HERDR_APP_HOME') or Path(os.environ.get('XDG_CONFIG_HOME') or Path.home()/'.config')/'herdr-app')
def call(*args):
    return subprocess.check_output(['herdr-app',*args],text=True,timeout=20)
status=json.loads(call('status'))
if status.get('overlays'):
    raise SystemExit('Close overlays before capturing; they may contain private data.')
previous=status['layout']
layout_path=home/'layouts/tinydust-preview.json'
mod_path=home/'mods/tinydust-preview'
if layout_path.exists() or mod_path.exists():
    raise SystemExit('Preview path already exists; refusing to overwrite.')
x=json.loads((root/'layouts/tinydust.json').read_text())
def replace(node):
    ident=node.get('id')
    roles={'spaces':'spaces','sidebar-footer':'footer','tabs':'tabs','status':'status','workbench-label':'workbench'}
    if ident in roles: node['content']={'mod':'tinydust-preview','props':{'role':roles[ident],**({'terminal':True} if args.terminal and ident=='tabs' else {})}}
    if ident in ['agents','journal','brand','space-shortcuts']: node['content']['props']={**node['content'].get('props',{}),'demo':True}
    if ident=='main': node['content']=({'mod':'tinydust-preview','props':{'role':'terminal'}} if args.terminal else {'mod':'tinydust','props':{'role':'world','demo':True}})
    if ident=='work-body': node['children']=[child for child in node['children'] if child['id']!='panel']
    for child in node.get('children',[]):replace(child)
replace(x)
try:
    mod_path.mkdir()
    (mod_path/'mod.json').write_text('{"place":"none"}\n')
    shutil.copy2(root/'tests/preview/main.js',mod_path/'main.js')
    (mod_path/'workbench.js').write_text((root/'mods/tinydust/workbench.js').read_text().replace('mods/tinydust/workbench-sprout.svg','mods/tinydust-preview/workbench-sprout.svg'))
    shutil.copy2(root/'mods/tinydust/workbench-sprout.svg',mod_path/'workbench-sprout.svg')
    layout_path.write_text(json.dumps(x,indent=2)+'\n')
    call('check',str(mod_path))
    call('do','layout.switch','--name','tinydust-preview')
    time.sleep(2)
    status=json.loads(call('status'))
    if status['layout']!='tinydust-preview' or status.get('errors') or status.get('overlays'):
        raise RuntimeError('Preview not clean. No screenshot captured.')
    print(call('shot',str(root/('preview-workbench.png' if args.terminal else 'preview.png'))))
finally:
    if json.loads(call('status')).get('layout')=='tinydust-preview':
        call('do','layout.switch','--name',previous)
    layout_path.unlink(missing_ok=True)
    shutil.rmtree(mod_path,ignore_errors=True)
