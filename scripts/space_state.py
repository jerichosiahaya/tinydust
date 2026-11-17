"""Copy Herdr's Spaces list preferences once, without changing its data."""
import json
import os
from pathlib import Path
import tempfile


KEYS = ('machines.folded', 'machines.reconnecting')


def migrate_space_state(home):
    home = Path(home)
    source = home / 'data/spaces/store.json'
    directory = home / 'data/tinydust-spaces'
    target = directory / 'store.json'
    if target.is_symlink() or directory.is_symlink():
        raise ValueError('TinyDust Spaces storage is symlinked; no preferences were changed.')
    if target.exists() and not target.is_file():
        raise ValueError('TinyDust Spaces storage is not a file; no preferences were changed.')
    if target.exists() or (home / 'mods/tinydust-spaces/main.js').exists():
        return 'Existing TinyDust Spaces state kept.'
    if source.is_symlink():
        raise ValueError('Herdr Spaces storage is symlinked; no preferences were changed.')
    if not source.exists():
        return 'No existing Herdr Spaces preferences to copy.'
    if (home / 'data').is_symlink() or source.parent.is_symlink():
        raise ValueError('Herdr Spaces storage is symlinked; no preferences were changed.')
    if not source.is_file():
        raise ValueError('Herdr Spaces storage is not a file; no preferences were changed.')
    before = source.read_bytes()
    try:
        stored = json.loads(before)
        if not isinstance(stored, dict) or any(key in stored and not isinstance(stored[key], str) for key in KEYS):
            raise ValueError('Invalid Spaces storage')
    except (ValueError, UnicodeDecodeError) as error:
        raise ValueError('Herdr Spaces preferences could not be read; original data was not changed.') from error
    selected = {key: stored[key] for key in KEYS if key in stored}
    if not selected:
        return 'No existing Herdr Spaces preferences to copy.'
    directory.mkdir(parents=True, exist_ok=True)
    if directory.is_symlink():
        raise ValueError('TinyDust Spaces storage is symlinked; no preferences were changed.')
    fd, name = tempfile.mkstemp(prefix='.tinydust-spaces-', dir=directory)
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            json.dump(selected, stream, ensure_ascii=False)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        if source.is_symlink() or source.read_bytes() != before:
            raise ValueError('Herdr Spaces preferences changed during migration; original data was not changed.')
        try:
            os.link(temporary, target)
        except FileExistsError:
            return 'Existing TinyDust Spaces state kept.'
    finally:
        temporary.unlink(missing_ok=True)
    return 'Copied existing Herdr Spaces folding and reconnect preferences; original data is unchanged.'
