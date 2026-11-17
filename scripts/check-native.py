"""Check scenes, toasts, the creation menu and workbench trim without installing test mods."""
from pathlib import Path
import shutil
import subprocess
import tempfile

root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='tinydust-check-') as directory:
    target=Path(directory)
    shutil.copy2(root/'tests/native-check/main.js',target/'main.js')
    for name in ['game.js','grove.js','scene.js','toast.js','creation.js','workbench.js','spaces.js']:
        shutil.copy2(root/'mods/tinydust'/name,target/name)
    subprocess.run(['herdr-app','check',str(target)],check=True)
    main=(root/'mods/tinydust/main.js').read_text()
    assert 'setShared,props,theme' in main and 'const SAMPLE=[' in main
    for role in ['brand','font-menu','space-shortcuts','compact-spaces','clear-grove']:
        # Render the real role with isolated, sample-only props; never touch live settings.
        preview=main.replace('setShared,props,theme', 'setShared,props as originalProps,theme')
        preview=preview.replace('const SAMPLE=[', f'const props=()=>({{role:"{role}",demo:true}});\nconst SAMPLE=[')
        (target/'main.js').write_text(preview)
        subprocess.run(['herdr-app','check',str(target)],check=True)
