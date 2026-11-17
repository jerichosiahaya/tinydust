# TinyDust

**A little room to focus.** A cozy, 8-bit-inspired [Herdr](https://herdr.dev) layout: agents in the garden, one next step, and somewhere to park a thought.

![TinyDust in Herdr: an interactive pixel farm in the sidebar, an expanded sample farm with working and resting characters in the center, and a simple Now-and-notes journal on the right.](preview.png)

*Captured in Herdr with labeled sample agents, tasks, and workspace, using the bundled default font. The center demonstrates the expanded farm; normally your terminals live there and “Visit farm” opens the larger scene in a dialog. No personal notes, conversations, or project names are included.*

[See the workbench with a labeled mock terminal](preview-workbench.png).

## A small, useful place

- **Original pixel farm.** A tiled roof, vegetable beds, orchard, pond, and a sleeping cat. Stepped highlights, contact shadows, and diagonal cast shadows add depth without blurring the pixels. No ripped game assets.
- **Eight little characters.** A cat, rabbit, fox, bear, frog, duck, farmer, and gardener. Each agent gets a stable character based on its terminal address—not its position in the list. Click the portrait to focus that agent. Working, needs-you, done, and idle are written out, not just color-coded.
- **A little working world.** Characters water crop plots, rest on picnic blankets, wait at a help sign, or throw their arms up with **“Finished!”**. Click a character or its nameplate to focus the real agent. **Visit farm** opens a larger interactive scene; Escape or Back to work closes it.
- **A grove that stays.** Each distinct agent terminal TinyDust sees in a space plants one tree there. Trees remain when agents finish or disappear; tap one to see which agent planted it. This is a memory of observed agents, not a count of tasks, context tokens, or productivity.
- **Completion you can notice.** Finished characters cheer and display a speech bubble. Herdr's existing completion toast gets a TinyDust portrait and “Harvest ready” styling; clicking it focuses that agent. Existing Herdr sounds are respected, with no second notification or extra loud sound.
- **A gentle completion chime.** An original 1.2-second C-major melody is bundled. The installer selects it when no custom completion sound is set, preserving mute and existing custom sounds. **Herdr applies this sound globally, including other layouts.**
- **A cozy workbench.** A tiny pixel sprout and garden-colored trim frame the terminal area; a clearer rose outline marks the focused pane. The decoration sits outside your terminal text. Herdr's original pane headers, split/zoom/close controls, fonts, and terminal colors stay intact.
- **Colorful space shortcuts.** A compact row of flower, house, tree, and star icons provides quick space switching. Their colors follow Herdr's saved space colors; the original Spaces list remains below for its menus, reordering, machines, and worktrees. Icons are assigned automatically, not picked individually.
- **A little cottage logo.** The original pixel cottage sits beside the full **TinyDust** wordmark. The title uses the bundled Nads Handwriting font by default. Click **Aa** to enter another installed font family; only the TinyDust title changes, not your terminal or other interface text. On a narrow rail the cottage can stand alone; at the smallest width only the New control fits.
- **A softer palette.** Dusty rose, lilac, sage, apricot, and denim blue, grounded by warm charcoal. Colorful and a little sweet without turning everything pink.
- **A simpler journal.** Just **Now** and **Notes** up front. Notes save locally as you type. Expand **Tasks** when you need the list; it starts folded away. The same journal follows you across spaces.
- **Small tasks, fewer buttons.** Expand Tasks, type a step and press Enter or Add. Use **Focus** to make it your one Now task, or the circle to complete it. Completed tasks can be reopened; the last completion can be undone.
- **Quiet view.** Hides the landscape and next-step/completed lists, while keeping your current task, notes, and agent statuses accessible. “Show more” brings everything back.
- **Motion off by default.** Turn it on for two-frame watering, falling droplets, gentle movement, cheering, and tree shakes. Quiet view suppresses motion; **Resume game** explicitly leaves Quiet view and enables it. No frame-polling loops, confetti, or flashing help markers.
- **One creation menu.** **+ New** in the top-left bar opens **New tab**, **New space**, and **New terminal**. A tab opens a shell in the current space; a space creates a workspace with a shell; a terminal splits a shell to the right of the current pane. Current machine/space/pane targets are preserved. Unavailable actions explain what to select first.
- **Your normal workspace.** Herdr's tabs, pane controls, files, changes, spaces, and status bar remain available. The **Journal** button hides or shows the right sidebar. In a narrow sidebar, the creation button becomes **+** and some header controls hide until the sidebar is widened.

### Meet the crew

![Eight original pixel characters: Miso, Clover, Maple, Cocoa, Fern, Sunny, Rowan, and Sage.](mods/tinydust/characters.svg)

**Miso** the cat · **Clover** the rabbit · **Maple** the fox · **Cocoa** the bear · **Fern** the frog · **Sunny** the duck · **Rowan** the farmer · **Sage** the gardener.

Character names appear in portrait tooltips. They're visual companions, not extra agents. Different terminals may share a character; the cast does not impose an agent limit. The compact sidebar farm shows three characters per page, and the larger Visit farm shows six; Previous/Next reaches the rest. Up to 24 trees are drawn, with the exact total and visible count stated when that limit is reached.

### Your persistent grove

TinyDust starts by planting trees for the agents it can currently see, then records newly observed agent terminals in their respective spaces. Trees remain through working, resting, completion, or disappearance. The same terminal is counted only once per space; reusing it for another conversation or agent does not necessarily plant another tree. Herdr may assign a different address after recovery, which can look like a new terminal. Agents that came and went while TinyDust wasn't observing cannot be reconstructed.

To reset one space, open **Visit farm → Clear grove** and confirm. This is not undoable. Agents already present at the time of clearing are remembered so their trees do not immediately reappear; a newly seen terminal can plant a new tree. Other spaces are untouched.

### Completion and notifications

TinyDust follows Herdr's `working`, `blocked`, `done`, and `idle` statuses. `done` means finished while you weren't looking; Herdr changes it to `idle` when you focus the agent, clearing the celebration. An agent that stops reporting or merely goes idle is not falsely counted as a completed task.

Herdr plays its configured completion sound; it also posts an **in-app toast** when you aren't looking at that agent. TinyDust styles that existing toast rather than sending another one. Set sounds in **Settings → Alerts**, also reachable from **Alert settings** in the expanded farm. TinyDust adds no external push service, OS-notification helper, literal scream, or agent hook.

### ADHD-conscious, not a medical claim

TinyDust aims to reduce what competes for attention: one visible priority, a place for stray thoughts, stable agent order, reversible completion, explicit labels, and optional motion. No streaks, deadlines, guilt counters, or automatic task promotion. Different people need different things; this is a design preference, not a treatment or clinically validated accessibility claim.

## Install

Requires **Herdr**. Tested with **Herdr 0.1.16 on Linux**; other versions and platforms are not yet verified. Open Herdr once so it creates its customization guide and API files.

Ask your coding agent:

> Read ~/.config/herdr-app/AGENTS.md, then install the TinyDust layout from https://github.com/jerichosiahaya/tinydust. Read the source first, leave my existing layouts intact, and run herdr-app check on both mods.

Or, with Git and Python 3:

```sh
git clone https://github.com/jerichosiahaya/tinydust.git
cd tinydust
python3 scripts/install.py
herdr-app do layout.switch --name tinydust
```

Review the installer before running it. It copies TinyDust's layout, theme, art, bundled MP3 and font, and two mods into your Herdr config, then checks the mods. It refuses to overwrite existing TinyDust files unless you pass `--update`. By default it also selects TinyDust's **global** completion sound if no custom one exists; use `--keep-sound` to leave sound settings alone. It does not overwrite other layout files, change keyboard shortcuts, or alter terminal sessions.

You can also select **tinydust** in **Settings → Look**. If new mods aren't discovered immediately, restart Herdr once.

### Default completion sound

[Download/listen to the TinyDust chime](mods/tinydust/harvest-complete.mp3).

Herdr 0.1.16 does **not** have per-layout sound defaults. The installer sets `sounds.done` in `settings.json` to `mods/tinydust/harvest-complete.mp3`, so it is used in **all Herdr layouts**, not only TinyDust. It still uses Herdr's normal completion delivery—there is no extra playback or duplicate alert.

- No custom `sounds.done`: select the bundled chime.
- An existing custom sound: keep it unchanged.
- Muted sounds: stay muted. The blocked/request sound and unrelated settings are preserved.
- Settings are backed up privately under `backups/tinydust-sound-<timestamp>/settings.json` before replacement. Invalid, symlinked, or concurrently changed settings are not knowingly overwritten.

```sh
# Install without changing the global completion sound:
python3 scripts/install.py --keep-sound

# Explicitly replace an existing custom sound with TinyDust's:
python3 scripts/install.py --update --use-tinydust-sound
```

On updates, `--keep-sound` can also be combined with `--update`. To return to Herdr's built-in sound, remove only `sounds.done` from your Herdr `settings.json`, leaving other fields intact, and use `--keep-sound` on subsequent installs/updates. Manually copying layout/mod files does not select the chime; agents performing a manual installation should explain the global scope and follow the same preservation policy before changing settings.

You can preview the selected completion sound in **Settings → Alerts**. The file has a conservative digital peak, but actual loudness depends on your system volume.

### Update

```sh
git pull --ff-only
python3 scripts/install.py --update
```

The installer backs up existing TinyDust files under `~/.config/herdr-app/backups/tinydust-<timestamp>/`. It skips unchanged files (including equivalently formatted layout JSON) and stages each changed file before atomic replacement, loading dependencies before mod entry points; the update as a whole is not a transaction. Your journal and grove live in Herdr's runtime storage, not these source files. Updates don't intentionally modify them. Back up that storage separately before changing or deleting mods.

### Customize the title font

1. Click **Aa** beside the TinyDust title (widen the sidebar if it is hidden).
2. Enter an installed font's **family name**, such as `Geist`, and choose **Save**. This affects only the TinyDust title.
3. Leave the field blank and save to return to **Nads Handwriting**. The previous default, `Silkscreen`, is still bundled and can be chosen by name. Herdr falls back if it cannot find a font.

Install custom fonts with your operating system or put `.ttf` / `.otf` files in your Herdr home's `fonts/` directory. Restart Herdr if a newly installed font is not picked up. The selection is stored in Herdr shared preferences and survives TinyDust updates; the installer doesn't overwrite unrelated personal font files.

### Controls

| Action | How |
| --- | --- |
| Change the TinyDust title font | Aa → enter an installed family name → Save; leave blank for Nads Handwriting |
| Switch spaces | Click a colorful shortcut or use Herdr's Spaces list below |
| Create a tab | + New → New tab (a shell in the current space) |
| Create a workspace | + New → New space |
| Split a terminal | + New → New terminal (right of the current pane) |
| Focus an agent | Click its scene character, nameplate, or list row |
| Open the larger farm | Visit farm; Escape or Back to work to leave |
| Inspect/shake a tree | Click a tree, including one whose agent has left; shaking requires Motion on |
| Clear a space's grove | Visit farm → Clear grove → confirm; current agents will not immediately replant |
| See more farmhands | Previous / Next under the scene |
| Open the task list | Tasks, below Notes |
| Add a task | Type a small step, then Enter or Add |
| Pick the current task | Focus |
| Put it back in the list | Later |
| Complete / restore | Done on the Now card; circle/checkmark on a task row; Undo last completion |
| Reduce visual load | Quiet view; Show more to return |
| Toggle notes sidebar | Journal, in the top-left brand bar |
| Animate the game | Motion on; off initially. Resume game leaves Quiet view and enables motion |
| Preview/configure completion sound | Settings → Alerts, or Alert settings in Visit farm; the selected sound is global |
| Navigate journal controls | Native buttons and inputs support keyboard focus; Enter submits a task |

On a narrow window, hide the journal or collapse Herdr's sidebar. Small garden panels omit the landscape. The task list and scratchpad remain scrollable. This is a desktop layout, not a mobile UI.

## Privacy and storage

**Herdr mods are trusted, unsandboxed code. Read them before installing.**

TinyDust's two runtime mods:

- Make **no network requests**, launch **no background helper programs**, install **no agent plugins**, and do not read terminal output or project files. The New menu starts shells only when explicitly selected, using Herdr's normal creation commands.
- Read Herdr's agent/space state to draw the farm, and existing notification payloads to style toasts. Issue normal focus/layout/overlay commands when clicked; no duplicate completion notifications are generated.
- Store grove history in Herdr's local `shared.json` under `tinydust.groves.v1`: space IDs, agent terminal addresses, and short program names only—not conversation text, terminal output, or task titles. This is plaintext and local to the Herdr app home; it does not automatically sync across devices.
- Save the journal with Herdr's per-mod-copy `localStorage`, under the `journal-v1` key. Preferences use shared keys prefixed with `tinydust.`; space shortcuts read Herdr's existing `space.colors` without changing it.
- Keep data **on this device, in plaintext**. There is no cloud sync, encryption, or automatic journal backup. Other trusted software on your device can access it. Don't use it as a secret store.

Back up your Herdr config's `data/` directory and `shared.json` **privately** while Herdr is closed before removing/reinstalling a mod or migrating machines. The journal is in `data/`; grove history is in `shared.json`. Don't commit either to Git. Herdr saves shared state asynchronously and does not report disk-write failures to mods; keep backups. Multiple independent app instances using one home have last-write-wins behavior. A cloned layout or a second journal mod instance may have its own storage; TinyDust is not a multi-window collaborative notebook.

If stored data is malformed, TinyDust shows an error and refuses to replace it. If saving fails, the journal reports it—keep the panel open and copy the notes somewhere safe. This first version has a 500-task limit, a 240-character task-title limit, and no delete/edit/export UI; completed tasks can be reopened.

Herdr's own network, telemetry, notifications, shipped mods, and remote-machine behavior are separate from TinyDust. Quiet view does not silence Herdr's built-in sounds or notifications; configure those in **Settings → Alerts**.

## Develop

No npm dependencies or build step are needed to run the layout. Node.js 22+ is used only for tests; Python 3 generates the original SVG and installs files.

```sh
npm test
python3 -m unittest discover -s tests -p '*_test.py' -v
python3 scripts/draw-art.py
python3 scripts/draw-characters.py
python3 scripts/install.py --update
herdr-app check ~/.config/herdr-app/mods/tinydust
herdr-app check ~/.config/herdr-app/mods/tinydust-journal
python3 scripts/check-native.py
```

| Path | Purpose |
| --- | --- |
| `layouts/tinydust.json` | Window arrangement and mod slots |
| `themes/tinydust.json` | Rose, lilac, and sage terminal/panel colors |
| `mods/tinydust/` | Brand, interactive farm, character poses, and notification skin |
| `mods/tinydust/game.js` | Pure status, character, grove display, pagination, and positioning rules |
| `mods/tinydust/grove.js` | Validated per-space grove history and reset rules |
| `mods/tinydust/scene.js` | Native scene drawing, working/resting/cheering poses, interaction targets |
| `mods/tinydust/toast.js` | Existing Herdr notifications in TinyDust style |
| `mods/tinydust/creation.js` | Unified creation menu with captured/stale-target checks |
| `mods/tinydust/spaces.js` | Colorful space shortcuts using Herdr's existing color assignments |
| `mods/tinydust/fonts/` | Nads Handwriting and Silkscreen, with their separate notices |
| `mods/tinydust/workbench.js` | Decorative workbench trim; uses the original pixel sprout SVG |
| `mods/tinydust/logo.svg` | Original pixel cottage and sparkle mark |
| `mods/tinydust-journal/` | Notes, tasks, Quiet view, storage |
| `scripts/draw-art.py` | Deterministic, dependency-free farm SVG source |
| `scripts/draw-characters.py` | Eight characters, work/rest/cheer poses, and lineup |
| `scripts/check-native.py` | Populated, animated scene and toast checks in Herdr |
| `scripts/make-chime.py` | Original synthesized chime source; rebuilding requires ffmpeg |
| `scripts/completion_sound.py` | Default sound policy and backed-up settings update |
| `scripts/screenshot.py` | Temporary sample-data preview; restores the previous layout |
| `tests/` | State/render tests, native fixtures, and sample screenshot chrome |
| `RECIPE.md` | Brief for rebuilding or remixing the layout |

The MP3 is committed, so users do not need ffmpeg to install TinyDust. To regenerate it, install ffmpeg and run `python3 scripts/make-chime.py`. Playback uses Herdr's existing audio support; TinyDust does not install a player.

To regenerate the README screenshot, install TinyDust, open Herdr at a comfortable desktop size (the current capture is 1920×1046), close overlays, then run:

```sh
python3 scripts/screenshot.py
python3 scripts/screenshot.py --terminal
```

The script temporarily switches layouts and substitutes sample data for private content. It captures the expanded farm as `preview.png` or a **mock**, non-interactive terminal as `preview-workbench.png`; then it restores the previous layout if the preview is still active. **Always inspect the whole image before publishing it.**

### Validation

Twenty-one Node test cases cover responsive logo and full-name behavior, persistent grove storage, per-space clearing and corrupt-data protection, compact-scene geometry and paging, space shortcuts and stale/demo targets, title-font settings, decorative workbench layout and preservation of native pane headers, creation-menu routing and stale/demo targets, journal storage and undo, missing/corrupt data, save failures, demo isolation, exact agent focus, live tree counts and limits, pagination, stable characters, pose assets, Quiet view/motion, tree interactions, and Herdr's info-level completion toast format. Render tests use host doubles, not a full GUI driver. Both mods pass Herdr's native check; an additional fixtures check populated animated scenes, notification variants, the creation menu, workbench trim, space shortcuts, the brand, font menu, and grove confirmation. Creation routing is tested with host doubles; tests do not open real tabs or shells. Eight Python tests cover default/forced/opt-out sound selection, mute/custom-setting preservation, backups, invalid/symlinked/concurrently changed settings, failure cleanup, and installation of the sound, font, and license in an isolated sandbox. The installer tests also cover preserving existing font preferences and equivalent layout JSON, skipping unchanged files, and preserving an installed file when replacement fails. The MP3 was decoded and measured locally (1.2 seconds, approximately −17.5 dBFS peak, no clipping); playback through the user's speakers was not auditioned. The workbench, compact sidebar, title font, logo, and sample font menu were visually inspected using sample data on Linux, not actual terminal output; narrow rendering was exercised by native fixtures and host doubles. Full keyboard/screen-reader, split-pane interaction, full app-restart persistence, end-to-end notification delivery, constrained-window visual inspection, and cross-platform testing remain outstanding.

## Credits and license

Inspired by the cozy farming-sim genre and the idea of agents as little characters in [Pixel HQ](https://github.com/bnhan2710/pixel-hq). The interactive farm also takes design inspiration from [World of Codecraft](https://github.com/kevinpardo/world-of-codecraft): status-specific work/rest areas, completion markers, clickable characters, and a larger world view. TinyDust's implementation, artwork, and synthesized chime are original; no World of Codecraft code, art, fonts, integrations, or hooks are bundled. No Stardew Valley or Harvest Moon assets, names, music, or characters are bundled; this is not affiliated with either game.

TinyDust's code and original art are [MIT licensed](LICENSE). **Nads Handwriting** was provided by its owner for inclusion and redistribution with TinyDust; it is not covered by the MIT license. See its [notice](mods/tinydust/fonts/NadsHandwriting-NOTICE.txt) for the stated permission. The bundled [Silkscreen](https://github.com/googlefonts/silkscreen) display font, by Jason Kottke and the Silkscreen Project Authors, is separately licensed under the [SIL Open Font License 1.1](mods/tinydust/fonts/OFL-Silkscreen.txt); it is redistributed unmodified from [Google Fonts](https://github.com/google/fonts/tree/7af0d90b4d532ffa4b041937b560c6df4e7b1e95/ofl/silkscreen). Herdr and the shipped mods that the layout references are separate projects under their own licenses; they aren't bundled here.
