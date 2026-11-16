"""Capture Herdr with explicit sample data, never terminals or the personal journal."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

root=Path(__file__).resolve().parents[1]
home=Path(os.environ.get('HERDR_APP_HOME') or Path(os.environ.get('XDG_CONFIG_HOME') or Path.home()/'.config')/'herdr-app')
def call(*args):
    return subprocess.check_output(['herdr-app',*args],text=True)
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
    roles={'spaces':'spaces','sidebar-footer':'footer','tabs':'tabs','status':'status'}
    if ident in roles: node['content']={'mod':'tinydust-preview','props':{'role':roles[ident]}}
    if ident in ['agents','journal']: node['content']['props']={'demo':True}
    if ident=='main': node['content']={'mod':'tinydust','props':{'role':'world','demo':True}}
    if ident=='work-body': node['children']=[child for child in node['children'] if child['id']!='panel']
    for child in node.get('children',[]):replace(child)
replace(x)
try:
    mod_path.mkdir()
    (mod_path/'mod.json').write_text('{"place":"none"}\n')
    shutil.copy2(root/'tests/preview/main.js',mod_path/'main.js')
    layout_path.write_text(json.dumps(x,indent=2)+'\n')
    call('check',str(mod_path))
    call('do','layout.switch','--name','tinydust-preview')
    time.sleep(2)
    status=json.loads(call('status'))
    if status['layout']!='tinydust-preview' or status.get('errors') or status.get('overlays'):
        raise RuntimeError('Preview not clean. No screenshot captured.')
    print(call('shot',str(root/'preview.png')))
finally:
    call('do','layout.switch','--name',previous)
    layout_path.unlink(missing_ok=True)
    shutil.rmtree(mod_path,ignore_errors=True)
