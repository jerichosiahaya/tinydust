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
        env = {**os.environ, 'HERDR_APP_HOME': str(self.home), 'PATH': str(binary) + os.pathsep + os.environ.get('PATH', '')}
        subprocess.run([sys.executable, str(ROOT / 'scripts/install.py')], env=env, check=True, capture_output=True)
        self.assertEqual((self.home / SOUND).read_bytes(), (ROOT / 'mods/tinydust/harvest-complete.mp3').read_bytes())
        font = Path('mods/tinydust/fonts/Silkscreen-Regular.ttf')
        license_file = Path('mods/tinydust/fonts/OFL-Silkscreen.txt')
        self.assertEqual((self.home / font).read_bytes(), (ROOT / font).read_bytes())
        self.assertEqual((self.home / license_file).read_bytes(), (ROOT / license_file).read_bytes())
        self.assertEqual(self.read()['sounds'], {'enabled': False, 'done': SOUND})
        self.store({'sounds': {'done': 'leave-this.mp3'}})
        personal = self.home / 'mods/tinydust/fonts/MyFont.ttf'
        personal.write_bytes(b'personal font')
        subprocess.run([sys.executable, str(ROOT / 'scripts/install.py'), '--update', '--keep-sound'], env=env, check=True, capture_output=True)
        self.assertEqual(personal.read_bytes(), b'personal font')
        self.assertEqual(self.read()['sounds']['done'], 'leave-this.mp3')


if __name__ == '__main__':
    unittest.main()
