"""Install only TinyDust's files. Existing files require explicit --update."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from completion_sound import configure_sound

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--update', action='store_true', help='Replace TinyDust files, keeping a backup')
sound = parser.add_mutually_exclusive_group()
sound.add_argument('--keep-sound', action='store_true', help='Leave the global Herdr completion sound unchanged')
sound.add_argument('--use-tinydust-sound', action='store_true', help='Explicitly replace an existing custom completion sound globally')
args = parser.parse_args()
print('Sound: TinyDust is selected globally if no custom completion sound exists. Mute is preserved. Use --keep-sound to opt out.')
home = Path(os.environ.get('HERDR_APP_HOME') or Path(os.environ.get('XDG_CONFIG_HOME') or Path.home()/'.config')/'herdr-app')
if not (home/'AGENTS.md').exists():
    raise SystemExit('Open Herdr once first. No files installed.')
files = [Path('layouts/tinydust.json'), Path('layouts/tinydust.svg'), Path('themes/tinydust.json')]
for mod in ['tinydust', 'tinydust-journal']:
    files += [p.relative_to(root) for p in (root/'mods'/mod).iterdir() if p.suffix in ['.js','.json','.svg','.mp3'] and p.name != 'jsconfig.json']
    font_dir = root/'mods'/mod/'fonts'
    if font_dir.exists():
        files += [p.relative_to(root) for p in font_dir.iterdir() if p.is_file() and p.suffix in ['.ttf','.otf','.txt']]
# Dependencies first, entry points next, and the layout last.
files.sort(key=lambda f: (2 if f == Path('layouts/tinydust.json') else 1 if f.name == 'main.js' else 0, str(f)))
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
def matches(f):
    target = home/f
    if not target.is_file():
        return False
    source, existing = (root/f).read_bytes(), target.read_bytes()
    if source == existing:
        return True
    if f == Path('layouts/tinydust.json'):
        try:
            return json.loads(source) == json.loads(existing)
        except (ValueError, UnicodeDecodeError):
            pass
    return False

changed = [f for f in files if not matches(f)]
staged = []
try:
    for f in changed:
        (home/f).parent.mkdir(parents=True,exist_ok=True)
        fd, name = tempfile.mkstemp(prefix='.tinydust-install-', dir=(home/f).parent)
        os.close(fd)
        staged.append((Path(name), home/f))
        shutil.copy2(root/f, name)
        os.utime(name, None)
    for temporary, destination in staged:
        os.replace(temporary, destination)
finally:
    for temporary, _ in staged:
        temporary.unlink(missing_ok=True)
for mod in ['tinydust','tinydust-journal']:
    subprocess.run(['herdr-app','check',str(home/'mods'/mod)],check=True)
try:
    print(configure_sound(home, keep=args.keep_sound, force=args.use_tinydust_sound))
except ValueError as error:
    raise SystemExit(f'Layout files installed, but sound settings were not changed: {error}')
print('Installed. Select tinydust in Settings > Look, or: herdr-app do layout.switch --name tinydust')
