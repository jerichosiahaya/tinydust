"""Check scenes, toasts, the creation menu and workbench trim without installing test mods."""
from pathlib import Path
import shutil
import subprocess
import tempfile

root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='tinydust-check-') as directory:
    target=Path(directory)
    shutil.copy2(root/'tests/native-check/main.js',target/'main.js')
    for name in ['game.js','grove.js','labels.js','farm-style.js','farm-style-ui.js','pane-ui.js','scene.js','noticeboard.js','toast.js','creation.js','workbench.js','space-status.js','spaces.js','usage-ui.js']:
        shutil.copy2(root/'mods/tinydust'/name,target/name)
    subprocess.run(['herdr-app','check',str(target)],check=True)
    spaces=target/'spaces.js'
    source=spaces.read_text()
    motion='const motion=!demo&&shared("tinydust.motion")===true&&shared("tinydust.quiet")!==true;'
    assert motion in source
    spaces.write_text(source.replace(motion,'const motion=true;'))
    subprocess.run(['herdr-app','check',str(target)],check=True)
    spaces.write_text(source)
    main=(root/'mods/tinydust/main.js').read_text()
    assert 'setShared,props,theme' in main and 'const SAMPLE=[' in main
    for role in ['brand','font-menu','space-shortcuts','compact-spaces','clear-grove','pane-header','pane-menu','rename-pane','usage','noticeboard','farm-style','world']:
        # Render the real role with isolated, sample-only props; never touch live settings.
        preview=main.replace('setShared,props,theme', 'setShared,props as originalProps,theme')
        preview=preview.replace('const SAMPLE=[', f'const props=()=>({{role:"{role}",demo:true}});\nconst SAMPLE=[')
        (target/'main.js').write_text(preview)
        subprocess.run(['herdr-app','check',str(target)],check=True)
    native=root/'mods/tinydust-spaces'
    assert (native/'space-status.js').read_bytes()==(root/'mods/tinydust/space-status.js').read_bytes()
    shutil.copy2(native/'space-status.js',target/'space-status.js')
    original=(native/'main.js').read_text()
    imports='import { agents, spaces, machines, panes, run, openOverlay, exec, hc, theme, shared, setShared, watchFolder, window, layout, checking } from "herdr";'
    assert imports in original
    preview=original.replace(imports,'''import { agents as originalAgents, spaces as originalSpaces, machines, panes, run, openOverlay, exec, hc, theme, shared, setShared, watchFolder, window, layout, checking } from "herdr";
const spaces=()=>[{id:"sample-a",name:"Sample farm",active:true,machine:null,folder:"",status:"blocked",tabs:[]}];
const agents=()=>[{space:"sample-a",status:"working"},{space:"sample-a",status:"done"},{space:"sample-a",status:"blocked"}];''')
    (target/'main.js').write_text(preview)
    subprocess.run(['herdr-app','check',str(target)],check=True)
