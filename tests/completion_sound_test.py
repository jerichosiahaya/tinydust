import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from completion_sound import SOUND, configure_sound


class CompletionSoundTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name)
        self.settings = self.home / 'settings.json'
        asset = self.home / SOUND
        asset.parent.mkdir(parents=True)
        asset.write_bytes(b'test fixture')

    def tearDown(self):
        self.temporary.cleanup()

    def store(self, value):
        self.settings.write_text(json.dumps(value))

    def read(self):
        return json.loads(self.settings.read_text())

    def test_first_install_and_repeat(self):
        configure_sound(self.home)
        self.assertEqual(self.read(), {'sounds': {'done': SOUND}})
        before = self.settings.read_bytes()
        self.assertIn('already selected', configure_sound(self.home))
        self.assertEqual(self.settings.read_bytes(), before)
        self.assertFalse((self.home / 'backups').exists())

    def test_preserves_mute_blocked_sound_and_other_settings_with_backup(self):
        original = {'zoom': 1.25, 'theme': 'custom', 'sounds': {'enabled': False, 'blocked': 'request.mp3'}}
        self.store(original)
        before = self.settings.read_bytes()
        self.assertIn('remain muted', configure_sound(self.home))
        self.assertEqual(self.read(), {**original, 'sounds': {**original['sounds'], 'done': SOUND}})
        backup = list((self.home / 'backups').glob('tinydust-sound-*/settings.json'))
        self.assertEqual(len(backup), 1)
        self.assertEqual(backup[0].read_bytes(), before)

    def test_keeps_custom_sound_unless_explicitly_forced(self):
        self.store({'sounds': {'done': 'my-chime.mp3', 'enabled': False}})
        before = self.settings.read_bytes()
        self.assertIn('Kept your custom', configure_sound(self.home))
        self.assertEqual(self.settings.read_bytes(), before)
        configure_sound(self.home, force=True)
        self.assertEqual(self.read()['sounds'], {'done': SOUND, 'enabled': False})

    def test_opt_out_and_invalid_settings_are_not_replaced(self):
        for invalid in ['broken', 'null', '[]', '{"sounds":null}', '{"sounds":{"done":false}}', '{"sounds":{"enabled":"yes"}}']:
            self.settings.write_text(invalid)
            self.assertIn('unchanged', configure_sound(self.home, keep=True))
            with self.assertRaises(ValueError):
                configure_sound(self.home)
            self.assertEqual(self.settings.read_text(), invalid)

    def test_concurrent_edit_is_detected_and_temporary_file_removed(self):
        self.store({'zoom': 1})
        with patch('completion_sound.os.fsync', side_effect=lambda _: self.store({'zoom': 2})):
            with self.assertRaisesRegex(ValueError, 'changed during'):
                configure_sound(self.home)
        self.assertEqual(self.read(), {'zoom': 2})
        self.assertEqual(list(self.home.glob('.tinydust-settings-*')), [])

    def test_missing_asset_and_write_failure_do_not_change_settings(self):
        self.store({'zoom': 1})
        before = self.settings.read_bytes()
        with patch('completion_sound.os.replace', side_effect=PermissionError('fixture')):
            with self.assertRaises(PermissionError):
                configure_sound(self.home)
        self.assertEqual(self.settings.read_bytes(), before)
        self.assertEqual(list(self.home.glob('.tinydust-settings-*')), [])
        (self.home / SOUND).unlink()
        with self.assertRaisesRegex(ValueError, 'missing'):
            configure_sound(self.home)
        self.assertEqual(self.settings.read_bytes(), before)

    @unittest.skipIf(os.name == 'nt', 'Creating symlinks may require Windows privileges')
    def test_symlinked_settings_are_not_replaced(self):
        target = self.home / 'linked-settings.json'
        target.write_text('{"zoom": 1}')
        self.settings.symlink_to(target)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            configure_sound(self.home)
        self.assertTrue(self.settings.is_symlink())
        self.assertEqual(target.read_text(), '{"zoom": 1}')

    @unittest.skipIf(os.name == 'nt', 'POSIX CLI stub; sound policy tests above are platform-independent')
    def test_installer_refuses_invalid_spaces_storage_before_changing_layout(self):
        binary = self.home / 'bin'
        binary.mkdir()
        checker = binary / 'herdr-app'
        checker.write_text('#!/bin/sh\n[ "$1" = "check" ]\n')
        checker.chmod(0o755)
        (self.home / 'AGENTS.md').write_text('Test sandbox')
        source = self.home / 'data/spaces/store.json'
        source.parent.mkdir(parents=True)
        source.write_text('{broken')
        layout = self.home / 'layouts/tinydust.json'
        layout.parent.mkdir(parents=True)
        layout.write_text('{"keep":"existing layout"}')
        before = layout.read_bytes()
        env = {**os.environ, 'HERDR_APP_HOME': str(self.home), 'PATH': str(binary) + os.pathsep + os.environ.get('PATH', '')}
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/install.py'), '--update', '--keep-sound'], env=env, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(layout.read_bytes(), before)
        self.assertEqual(source.read_text(), '{broken')
        self.assertFalse((self.home / 'data/tinydust-spaces/store.json').exists())

    @unittest.skipIf(os.name == 'nt', 'POSIX CLI stub; sound policy tests above are platform-independent')
    def test_installer_copies_real_mp3_and_applies_default_only_in_sandbox(self):
        # Stub the native checker so this test never talks to a real Herdr window.
        binary = self.home / 'bin'
        binary.mkdir()
        checker = binary / 'herdr-app'
        checker.write_text('#!/bin/sh\n[ "$1" = "check" ]\n')
        checker.chmod(0o755)
        (self.home / 'AGENTS.md').write_text('Test sandbox')
        (self.home / SOUND).unlink()
        self.store({'sounds': {'enabled': False}})
        shared = self.home / 'shared.json'
        shared.write_text(json.dumps({'tinydust.brandFont': 'Custom Font', 'other': {'keep': True}}))
        original_shared = shared.read_bytes()
        native_state = self.home / 'data/spaces/store.json'
        native_state.parent.mkdir(parents=True)
        native_state.write_text(json.dumps({'machines.folded': '["sample-remote"]'}))
        native_before = native_state.read_bytes()
        env = {**os.environ, 'HERDR_APP_HOME': str(self.home), 'PATH': str(binary) + os.pathsep + os.environ.get('PATH', '')}
        subprocess.run([sys.executable, str(ROOT / 'scripts/install.py')], env=env, check=True, capture_output=True)
        self.assertEqual((self.home / SOUND).read_bytes(), (ROOT / 'mods/tinydust/harvest-complete.mp3').read_bytes())
        for name in ['Silkscreen-Regular.ttf', 'OFL-Silkscreen.txt', 'NadsHandwriting-Regular.ttf', 'NadsHandwriting-NOTICE.txt']:
            asset = Path('mods/tinydust/fonts') / name
            self.assertEqual((self.home / asset).read_bytes(), (ROOT / asset).read_bytes())
        pane_license = Path('mods/tinydust/HERDR-PANE-LICENSE.txt')
        self.assertEqual((self.home / pane_license).read_bytes(), (ROOT / pane_license).read_bytes())
        scanner = Path('mods/tinydust/usage_scan.py')
        self.assertEqual((self.home / scanner).read_bytes(), (ROOT / scanner).read_bytes())
        for name in ['carrot', 'turnip', 'eggplant', 'broccoli']:
            asset = Path('mods/tinydust') / f'space-{name}.svg'
            self.assertEqual((self.home / asset).read_bytes(), (ROOT / asset).read_bytes())
        for name in ['main.js', 'mod.json', 'space-status.js', 'HERDR-SPACES-LICENSE.txt']:
            asset = Path('mods/tinydust-spaces') / name
            self.assertEqual((self.home / asset).read_bytes(), (ROOT / asset).read_bytes())
        new_state = self.home / 'data/tinydust-spaces/store.json'
        self.assertEqual(json.loads(new_state.read_text()), {'machines.folded': '["sample-remote"]'})
        self.assertEqual(native_state.read_bytes(), native_before)
        self.assertEqual(self.read()['sounds'], {'enabled': False, 'done': SOUND})
        self.store({'sounds': {'done': 'leave-this.mp3'}})
        personal = self.home / 'mods/tinydust/fonts/MyFont.ttf'
        personal.write_bytes(b'personal font')
        layout = self.home / 'layouts/tinydust.json'
        reformatted = json.dumps(json.loads(layout.read_text()), sort_keys=True) + '\n'
        layout.write_text(reformatted)
        unchanged = self.home / 'mods/tinydust/main.js'
        os.utime(unchanged, ns=(1_000_000_000, 1_000_000_000))
        before_mtime = unchanged.stat().st_mtime_ns
        changed = self.home / 'mods/tinydust/spaces.js'
        changed.write_bytes(b'old version')
        script = ROOT / 'scripts/install.py'
        fail = '''import os, runpy, sys
from pathlib import Path
original = os.replace
def replace(src, dst):
    if Path(dst).name == 'spaces.js': raise PermissionError('simulated replacement failure')
    return original(src, dst)
os.replace = replace
sys.path.insert(0, str(Path(sys.argv[1]).parent))
sys.argv = [sys.argv[1], '--update', '--keep-sound']
runpy.run_path(sys.argv[0], run_name='__main__')
'''
        failed = subprocess.run([sys.executable, '-c', fail, str(script)], env=env, capture_output=True)
        self.assertNotEqual(failed.returncode, 0)
        self.assertEqual(changed.read_bytes(), b'old version', 'failed replacement must not truncate the installed module')
        self.assertEqual(list(self.home.rglob('.tinydust-install-*')), [])
        subprocess.run([sys.executable, str(script), '--update', '--keep-sound'], env=env, check=True, capture_output=True)
        self.assertEqual(personal.read_bytes(), b'personal font')
        self.assertEqual(layout.read_text(), reformatted, 'equivalent layout formatting should not trigger a reload')
        self.assertEqual(unchanged.stat().st_mtime_ns, before_mtime, 'unchanged mods should not hot-reload')
        self.assertEqual(changed.read_bytes(), (ROOT / 'mods/tinydust/spaces.js').read_bytes())
        self.assertTrue(any(p.read_bytes() == b'old version' for p in (self.home / 'backups').glob('tinydust-*/mods/tinydust/spaces.js')))
        self.assertEqual(list(self.home.rglob('.tinydust-install-*')), [])
        self.assertEqual(shared.read_bytes(), original_shared, 'existing font choices and other shared data must survive')
        self.assertEqual(native_state.read_bytes(), native_before)
        self.assertEqual(json.loads(new_state.read_text()), {'machines.folded': '["sample-remote"]'})
        self.assertEqual(self.read()['sounds']['done'], 'leave-this.mp3')


if __name__ == '__main__':
    unittest.main()
