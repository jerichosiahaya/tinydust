import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from space_state import migrate_space_state


class SpaceStateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name)
        self.source = self.home / 'data/spaces/store.json'
        self.target = self.home / 'data/tinydust-spaces/store.json'

    def tearDown(self):
        self.temp.cleanup()

    def original(self, value):
        self.source.parent.mkdir(parents=True, exist_ok=True)
        self.source.write_text(json.dumps(value))

    def test_no_original_creates_nothing(self):
        self.assertIn('No existing', migrate_space_state(self.home))
        self.assertFalse(self.target.exists())

    def test_copies_only_list_preferences_and_leaves_original_untouched(self):
        value = {'machines.folded': '["remote"]', 'machines.reconnecting': '{"remote":{"removed":true}}', 'other': 'private'}
        self.original(value)
        before = self.source.read_bytes()
        self.assertIn('Copied', migrate_space_state(self.home))
        self.assertEqual(json.loads(self.target.read_text()), {k: value[k] for k in ('machines.folded', 'machines.reconnecting')})
        if os.name != 'nt':self.assertEqual(self.target.stat().st_mode & 0o077, 0)
        self.assertEqual(self.source.read_bytes(), before)
        self.assertIn('kept', migrate_space_state(self.home))

    def test_existing_target_and_installed_module_are_never_overwritten(self):
        self.original({'machines.folded': '["old"]'})
        self.target.parent.mkdir(parents=True)
        self.target.write_text('{"machines.folded":"[\\"new\\"]"}')
        before = self.target.read_bytes()
        migrate_space_state(self.home)
        self.assertEqual(self.target.read_bytes(), before)
        self.target.unlink()
        mod = self.home / 'mods/tinydust-spaces/main.js'
        mod.parent.mkdir(parents=True)
        mod.write_text('installed')
        migrate_space_state(self.home)
        self.assertFalse(self.target.exists())

    def test_invalid_original_is_not_reset(self):
        self.source.parent.mkdir(parents=True)
        self.source.write_text('{broken')
        with self.assertRaisesRegex(ValueError, 'could not be read'):
            migrate_space_state(self.home)
        self.assertEqual(self.source.read_text(), '{broken')
        self.assertFalse(self.target.exists())

    @unittest.skipIf(os.name == 'nt', 'Creating symlinks may require Windows privileges')
    def test_symlinked_sources_and_targets_are_refused(self):
        other = self.home / 'other.json'
        other.write_text('{}')
        self.source.parent.mkdir(parents=True)
        self.source.symlink_to(other)
        with self.assertRaisesRegex(ValueError, 'symlinked'):
            migrate_space_state(self.home)
        self.source.unlink()
        self.original({'machines.folded': '[]'})
        self.target.parent.mkdir(parents=True)
        self.target.symlink_to(other)
        with self.assertRaisesRegex(ValueError, 'symlinked'):
            migrate_space_state(self.home)
        self.assertEqual(other.read_text(), '{}')

    def test_source_change_during_copy_aborts_and_cleans_up(self):
        self.original({'machines.folded': '["old"]'})
        with patch('space_state.os.fsync', side_effect=lambda _: self.original({'machines.folded': '["new"]'})):
            with self.assertRaisesRegex(ValueError, 'changed during'):
                migrate_space_state(self.home)
        self.assertFalse(self.target.exists())
        self.assertEqual(list(self.target.parent.glob('.tinydust-spaces-*')), [])
        self.assertEqual(json.loads(self.source.read_text())['machines.folded'], '["new"]')

    def test_concurrent_target_is_kept(self):
        self.original({'machines.folded': '["old"]'})
        def race(_source, dest):
            Path(dest).write_text('{"new":"state"}')
            raise FileExistsError('concurrent file')
        with patch('space_state.os.link', side_effect=race):
            self.assertIn('kept', migrate_space_state(self.home))
        self.assertEqual(json.loads(self.target.read_text()), {'new': 'state'})
        self.assertEqual(list(self.target.parent.glob('.tinydust-spaces-*')), [])


if __name__ == '__main__':
    unittest.main()
