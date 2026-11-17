"""Select the bundled chime in Herdr's global settings, preserving user preferences."""
from datetime import datetime
import json
import os
from pathlib import Path
import stat
import tempfile

SOUND = 'mods/tinydust/harvest-complete.mp3'


def configure_sound(home, *, keep=False, force=False):
    home = Path(home)
    if keep:
        return 'Completion sound unchanged (--keep-sound).'
    if not (home / SOUND).is_file():
        raise ValueError('Bundled chime is missing; sound settings were not changed.')
    path = home / 'settings.json'
    if path.is_symlink():
        raise ValueError('settings.json is a symlink; configure the sound manually or use --keep-sound.')
    before = path.read_bytes() if path.exists() else None
    try:
        settings = json.loads(before) if before is not None else {}
    except (ValueError, UnicodeDecodeError) as error:
        raise ValueError('settings.json is invalid; original settings were not changed.') from error
    if not isinstance(settings, dict):
        raise ValueError('settings.json must be an object; original settings were not changed.')
    sounds = settings.get('sounds', {})
    if not isinstance(sounds, dict):
        raise ValueError('sounds must be an object; original settings were not changed.')
    current = sounds.get('done')
    if current is not None and not isinstance(current, str):
        raise ValueError('sounds.done must be a path; original settings were not changed.')
    if current == SOUND:
        return 'TinyDust completion chime is already selected (global Herdr setting).'
    if current and not force:
        return 'Kept your custom completion sound. Use --use-tinydust-sound to replace it globally.'
    if 'enabled' in sounds and not isinstance(sounds['enabled'], bool):
        raise ValueError('sounds.enabled must be a boolean; original settings were not changed.')
    settings['sounds'] = {**sounds, 'done': SOUND}
    payload = (json.dumps(settings, indent=2, ensure_ascii=False) + '\n').encode('utf-8')
    mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o600
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=home, prefix='.tinydust-settings-', delete=False) as output:
            temporary = Path(output.name)
            output.write(payload)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, mode)
        # Don't knowingly overwrite settings edited while this update was being prepared.
        if (path.read_bytes() if path.exists() else None) != before:
            raise ValueError('Settings changed during installation; retry or use --keep-sound.')
        if before is not None:
            backup = home / 'backups' / ('tinydust-sound-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
            backup.mkdir(parents=True)
            with (backup / 'settings.json').open('xb') as output:
                output.write(before)
            os.chmod(backup / 'settings.json', 0o600)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    muted = ' Sounds remain muted.' if sounds.get('enabled') is False else ''
    return 'Selected TinyDust completion chime for ALL Herdr layouts; other settings preserved.' + muted
