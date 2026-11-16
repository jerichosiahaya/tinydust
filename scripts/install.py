"""Install only TinyDust's files. Existing files require explicit --update."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--update', action='store_true', help='Replace TinyDust files, keeping a backup')
args = parser.parse_args()
home = Path(os.environ.get('HERDR_APP_HOME') or Path(os.environ.get('XDG_CONFIG_HOME') or Path.home()/'.config')/'herdr-app')
if not (home/'AGENTS.md').exists():
    raise SystemExit('Open Herdr once first. No files installed.')
files = [Path('layouts/tinydust.json'), Path('layouts/tinydust.svg'), Path('themes/tinydust.json')]
for mod in ['tinydust', 'tinydust-journal']:
    files += [p.relative_to(root) for p in (root/'mods'/mod).iterdir() if p.suffix in ['.js','.json','.svg'] and p.name != 'jsconfig.json']
conflicts = [f for f in files if (home/f).exists()]
if conflicts and not args.update:
    raise SystemExit('TinyDust files already exist. Use --update to replace them with a backup.')
if conflicts:
    from datetime import datetime
    backup = home/'backups'/('tinydust-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    for f in conflicts:
        (backup/f).parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(home/f,backup/f)
    print('Previous code saved to', backup)
for f in files:
    (home/f).parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/f, home/f)
for mod in ['tinydust','tinydust-journal']:
    subprocess.run(['herdr-app','check',str(home/'mods'/mod)],check=True)
print('Installed. Select tinydust in Settings > Look, or: herdr-app do layout.switch --name tinydust')
