"""Check populated scenes, motion, and toast variants with Herdr, without installing test mods."""
from pathlib import Path
import shutil
import subprocess
import tempfile

root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='tinydust-check-') as directory:
    target=Path(directory)
    shutil.copy2(root/'tests/native-check/main.js',target/'main.js')
    for name in ['game.js','scene.js','toast.js']:
        shutil.copy2(root/'mods/tinydust'/name,target/name)
    subprocess.run(['herdr-app','check',str(target)],check=True)
