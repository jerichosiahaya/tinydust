# TinyDust

**A little room to focus.** A cozy, 8-bit-inspired [Herdr](https://herdr.dev) layout: agents in the garden, one next step, and somewhere to park a thought.

![TinyDust in Herdr: an interactive pixel farm with a small cat and decorations, sample farmhands, and a simple Now-and-notes journal.](preview.png)

*Captured in Herdr with labeled sample agents, tasks, and workspace, using the bundled default font. The center demonstrates the expanded farm; normally your terminals live there and “Visit farm” opens the larger scene in a dialog. No personal notes, conversations, or project names are included.*

[See the workbench with a labeled mock terminal](preview-workbench.png).

## A small, useful place

- **Original pixel farm.** A tiled roof, vegetable beds, orchard, pond, and a sleeping cat. Stepped highlights, contact shadows, and diagonal cast shadows add depth without blurring the pixels. No ripped game assets.
- **Eight little characters.** A cat, rabbit, fox, bear, frog, duck, farmer, and gardener. Each agent gets a stable character based on its terminal address—not its position in the list. Click the portrait to focus that agent. Working, needs-you, done, and idle are written out, not just color-coded.
- **A little working world.** Characters water crop plots, rest on picnic blankets, wait at a help sign, or throw their arms up with **“Finished!”**. Click a character or its nameplate to focus the real agent. **Visit farm** opens a larger interactive scene; Escape or Back to work closes it. For a little celebration, press **Dance!** to make the farmhands sway and hop; press **Stop dancing** when they're done.
- **A grove that stays.** Each distinct agent terminal TinyDust sees in a space plants one tree there. Trees remain when agents finish or disappear; tap one to see which agent planted it. This is a memory of observed agents, not a count of tasks, context tokens, or productivity.
- **A little companion.** Pip the cat, Dot the rabbit, or Pippin the chick can hang out by the cottage. Click for a hello; with Motion on, they give a little hop. Pick a different friend or none for each space.
- **Make the farm yours.** Add flower patches, fence bunting, and pond lilies from **Visit farm → Make it yours**. Every decoration is available immediately, with no points or unlocks.
- **Farm noticeboard.** Open **Board** to see agents needing a hand or finished while unseen across spaces. Choose an entry to focus that exact agent. No new alerts, sounds, or persistent activity history.
- **Completion you can notice.** Finished characters cheer and display a speech bubble. Herdr's existing completion toast gets a TinyDust portrait and “Harvest ready” styling; clicking it focuses that agent. Existing Herdr sounds are respected, with no second notification or extra loud sound.
- **A gentle completion chime.** An original 1.2-second C-major melody is bundled. The installer selects it when no custom completion sound is set, preserving mute and existing custom sounds. **Herdr applies this sound globally, including other layouts.**
- **A cozy workbench.** A tiny pixel sprout and garden-colored trim frame the terminal area; a clearer rose outline marks the focused pane. The decoration sits outside your terminal text. TinyDust's pane header retains split/zoom/close controls without changing terminal fonts or colors.
- **Optional usage overview.** The workbench’s **Usage** button opens an independent, on-demand view of recent local Pi, Claude Code, Codex, and OpenCode usage. See token counts and recorded/estimated API value by source and model. Public-price lookup is optional; there is no Kanso dependency or automatic scanning.
- **Name what an agent is doing.** Right-click a terminal or its header and choose **Rename pane**. The label appears on that pane and its character in the sidebar and farm; on the narrow rail, hover the portrait to read it. These are manual TinyDust-only labels—not changes to the terminal's actual name or automatic task tracking.
- **Colorful space shortcuts.** A compact row of original pixel carrots, turnips, eggplants, and broccoli provides quick space switching. Space names, shortcuts, and rail icons use the same high-contrast symbols: **●** working, **✓** finished but not yet seen, and **!** needs attention. Multiple symbols can appear together; only the working symbol pulses when Motion is on, and all remain readable when it is off. Colors follow Herdr's saved space colors. The named list is adapted from Herdr's Spaces mod and retains its menus, reordering, machines, and worktrees. Icons are assigned automatically, not picked individually.
- **A colorful collapsible sidebar.** Click **‹** beside the space shortcuts to fold the sidebar into a slim rail; click **›** to restore its previous width. Colorful space icons and small agent portraits remain visible and clickable, along with the New menu.
- **A little cottage logo.** The original pixel cottage sits beside the full **TinyDust** wordmark. The title uses the bundled Nads Handwriting font by default. Click **Aa** to enter another installed font family; only the TinyDust title changes, not your terminal or other interface text. On a narrow rail the cottage can stand alone; at the smallest width only the New control fits.
- **A softer palette.** Dusty rose, lilac, sage, apricot, and denim blue, grounded by warm charcoal. Colorful and a little sweet without turning everything pink.
- **A simpler journal.** Just **Now** and **Notes** up front. Notes save locally as you type. Expand **Tasks** when you need the list; it starts folded away. The same journal follows you across spaces.
- **Small tasks, fewer buttons.** Expand Tasks, type a step and press Enter or Add. Use **Focus** to make it your one Now task, or the circle to complete it. Completed tasks can be reopened; the last completion can be undone.
- **Quiet view.** Hides the landscape and next-step/completed lists, while keeping your current task, notes, and agent statuses accessible. “Show more” brings everything back.
- **Motion off by default.** Turn it on for two-frame watering, falling droplets, gentle movement, cheering, and tree shakes. The visit's **Dance!** button is a separate, temporary opt-in and doesn't change your saved motion setting. It stops when you leave, change spaces, or enter Quiet view; **Resume game** explicitly leaves Quiet view and enables ambient motion. No frame-polling loops, confetti, or flashing help markers.
- **One creation menu.** **+ New** in the top-left bar opens **New tab**, **New space**, and **New terminal**. A tab opens a shell in the current space; a space creates a workspace with a shell; a terminal splits a shell to the right of the current pane. Current machine/space/pane targets are preserved. Unavailable actions explain what to select first.
- **Your normal workspace.** Herdr's tabs, pane controls, files, changes, spaces, and status bar remain available. The **Journal** button hides or shows the right sidebar. In a narrow sidebar, the creation button becomes **+** and some header controls hide until the sidebar is widened.

### Meet the crew

![Eight original pixel characters: Miso, Clover, Maple, Cocoa, Fern, Sunny, Rowan, and Sage.](mods/tinydust/characters.svg)

**Miso** the cat · **Clover** the rabbit · **Maple** the fox · **Cocoa** the bear · **Fern** the frog · **Sunny** the duck · **Rowan** the farmer · **Sage** the gardener.

Character names appear in portrait tooltips. They're visual companions, not extra agents. Different terminals may share a character; the cast does not impose an agent limit. The compact sidebar farm shows three characters per page, and the larger Visit farm shows six; Previous/Next reaches the rest. Up to 24 trees are drawn, with the exact total and visible count stated when that limit is reached.

### A friend and a few decorations

Open **Visit farm → Make it yours**. Each space starts with Pip the cat; you can choose Dot the rabbit, Pippin the chick, or **No companion**. Click your friend in the scene for a hello. The hop is enabled only when Motion is on and Quiet view is off; the greeting works without motion or sound.

Flower patches, fence bunting, and pond lily pads start off and can be switched on independently. Choices are saved for the current space, and other spaces and grove trees are unchanged. The README preview shows all three decorations using sample choices.

### Farm noticeboard

Click **Board** in the workbench or garden sidebar. The board groups live agents from all available spaces into **Needs a hand** and **Finished, not yet seen**; working and idle agents are not listed. Click a row to visit that agent. Herdr changes finished to idle once the agent is seen; this is not a general unread-message indicator. The board keeps no history and adds no notification or sound. When the workbench is very narrow, its Board control becomes **!**; below 80px it is hidden.

### Your persistent grove

TinyDust starts by planting trees for the agents it can currently see, then records newly observed agent terminals in their respective spaces. Trees remain through working, resting, completion, or disappearance. The same terminal is counted only once per space; reusing it for another conversation or agent does not necessarily plant another tree. Herdr may assign a different address after recovery, which can look like a new terminal. Agents that came and went while TinyDust wasn't observing cannot be reconstructed.

To reset one space, open **Visit farm → Clear grove** and confirm. This is not undoable. Agents already present at the time of clearing are remembered so their trees do not immediately reappear; a newly seen terminal can plant a new tree. Other spaces are untouched.

### Label a pane and its character

1. Right-click a terminal, its pane header, or its agent's sidebar portrait, then choose **Rename pane**. If a terminal program takes right-clicks, use **Shift+right-click** for Herdr's menu.
2. Type what the agent is working on and save. The label appears in the pane header, agent list, and farm nameplate; the full label is in the tooltip when space is tight.
3. To remove a label, open Rename pane again, clear the field, and save. Labels are single-line and limited to 80 characters.

The right-click menu's **More Herdr actions…** opens Herdr's original pane menu, including split, zoom, close, and program-specific options. Labels belong to a particular pane and terminal pair, remain local to TinyDust, and do not automatically change when an agent starts different work. A terminal temporarily shown in someone else's pane cannot be labeled there; first give it a pane of its own. If the pane closes or its terminal changes while the dialog is open, the label is not saved to another target.

### Usage and privacy

Click **Usage** in the workbench, then choose **Scan offline** or **Scan + public prices**. The scanner reads recent local session files for Pi, Claude Code, Codex and OpenCode’s SQLite database, and extracts usage metadata. It does not save prompt text or session records, and the result stays in memory. Scans run only when requested; an in-flight scan may finish shortly after the dialog closes. Python 3 must be available as `python3` to Herdr.

By default it looks under `~/.pi/agent/sessions`, `~/.claude/projects`, `~/.codex/sessions` and `~/.codex/archived_sessions`, and `~/.local/share/opencode`. It honors `PI_CODING_AGENT_DIR`, `CLAUDE_CONFIG_DIR`, a single-directory `CODEX_HOME`, and `XDG_DATA_HOME` when set; symlinked session files are skipped.

**Scan + public prices** fetches the public [OpenRouter model catalog](https://openrouter.ai/api/v1/models); it sends no session content or model names. Offline scans make no network requests. The display uses recorded costs where available, otherwise exact model matches in the catalog; missing prices are marked **unpriced**, not treated as free. Values are estimates or provider-reported amounts—not a bill, subscription quota, or current context-window percentage.

The view covers **today**, the **last 7 days**, and the **last 30 days** of session files modified within that 30-day window. A scan is bounded to 512 MiB, 25 seconds, 2,000 files, and 50,000 usage events; oversized records, errors, or limits are disclosed as partial results. Compressed Codex sessions are skipped, and Codex forked/resumed or newer record formats can be incomplete or duplicated. OpenCode support covers its local SQLite database. Model lists show the top eight; there is no project or prompt breakdown. These formats can change, so compare against your provider’s official billing for financial decisions.

### Completion and notifications

TinyDust follows Herdr's `working`, `blocked`, `done`, and `idle` statuses. `done` means finished while you weren't looking; Herdr changes it to `idle` when you focus the agent, clearing the celebration. An agent that stops reporting or merely goes idle is not falsely counted as a completed task.

Herdr plays its configured completion sound; it also posts an **in-app toast** when you aren't looking at that agent. TinyDust styles that existing toast rather than sending another one. Set sounds in **Settings → Alerts**, also reachable from **Alert settings** in the expanded farm. TinyDust adds no external push service, OS-notification helper, literal scream, or agent hook.

### ADHD-conscious, not a medical claim

TinyDust aims to reduce what competes for attention: one visible priority, a place for stray thoughts, stable agent order, reversible completion, explicit labels, and optional motion. No streaks, deadlines, guilt counters, or automatic task promotion. Different people need different things; this is a design preference, not a treatment or clinically validated accessibility claim.

## Install

Requires **Herdr**. Tested with **Herdr 0.1.16 on Linux**; other versions and platforms are not yet verified. Open Herdr once so it creates its customization guide and API files.

Ask your coding agent:

> Read ~/.config/herdr-app/AGENTS.md, then install the TinyDust layout from https://github.com/jerichosiahaya/tinydust. Read the source first, leave my existing layouts intact, and run herdr-app check on all three mods.

Or, with Git and Python 3:

```sh
git clone https://github.com/jerichosiahaya/tinydust.git
cd tinydust
python3 scripts/install.py
herdr-app do layout.switch --name tinydust
```

Review the installer before running it. It copies TinyDust's layout, theme, art, bundled MP3 and font, and three mods into your Herdr config, then checks the mods. It refuses to overwrite existing TinyDust files unless you pass `--update`. By default it also selects TinyDust's **global** completion sound if no custom one exists; use `--keep-sound` to leave sound settings alone. It does not overwrite other layout files, change keyboard shortcuts, or alter terminal sessions.

For the named space indicators, TinyDust uses its own copy of Herdr 0.1.16's Spaces mod. On first install, it copies existing machine-folding and reconnect preferences from Herdr's Spaces storage if its own storage doesn't already exist; the original is never modified. When copying, invalid or symlinked source data—or a change detected during the copy—causes the installer to stop rather than overwrite it. The copied list does **not** automatically inherit later Herdr updates.

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
| Switch spaces | Click a colorful shortcut, a compact rail icon, or use the named Spaces list |
| Collapse / expand sidebar | Click ‹ beside the space shortcuts / › in the narrow rail |
| Check space activity | ● working · ✓ finished but not yet seen · ! needs attention, beside names and icons |
| Create a tab | + New → New tab (a shell in the current space) |
| Create a workspace | + New → New space |
| Split a terminal | + New → New terminal (right of the current pane) |
| Focus an agent | Click its scene character, nameplate, or list row |
| Check agents across spaces | Board in the workbench or expanded garden sidebar; click an entry to visit |
| Choose a companion or decorations | Visit farm → Make it yours; choose a friend and toggle garden details |
| Say hello to the companion | Click the companion in the farm; hopping requires Motion on |
| Label an agent's pane | Right-click the terminal, pane header, or sidebar portrait → Rename pane |
| Open Herdr's original pane menu | Right-click a terminal → More Herdr actions… |
| Open the larger farm | Visit farm; Escape or Back to work to leave |
| Dance with the farmhands | Visit farm → Dance!; Stop dancing ends it. Quiet view must be off |
| View usage | Usage in the workbench → Scan offline, or Scan + public prices |
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

On a narrow window, hide the journal or collapse the sidebar. The rail shows colored space icons and miniature agent portraits with status-colored borders and descriptive tooltips. Right-click a space icon for Herdr's space menu; machine grouping and worktree management remain available when expanded. On macOS with visible window buttons, New moves beside the expand control to leave room for them. Expanding restores the width saved when you last collapsed with the button (or 300px if none was saved). Small garden panels omit the landscape. The task list and scratchpad remain scrollable. This is a desktop layout, not a mobile UI.

## Privacy and storage

**Herdr mods are trusted, unsandboxed code. Read them before installing.**

TinyDust's runtime mods:

- Do not read terminal output or source files or install agent plugins. The adapted Spaces list, like Herdr's original, reads Git metadata, watches repository metadata, and queries Herdr's machine list. The New menu starts shells only when explicitly selected, using Herdr's normal creation commands. The optional Usage scan launches a bounded local Python process only on request and reads AI session files; the optional pricing choice makes a public OpenRouter request without sending session contents. There is no automatic scanning or persistent usage cache.
- Read Herdr's agent/space state to draw the farm and noticeboard, and existing notification payloads to style toasts. The board is live, keeps no separate activity history, and does not scan terminal contents. Issue normal focus/layout/overlay commands when clicked; no duplicate completion notifications are generated.
- Store grove history in Herdr's local `shared.json` under `tinydust.groves.v1`: space IDs, agent terminal addresses, and short program names only—not conversation text, terminal output, or task titles. Pane labels are stored separately under `tinydust.paneLabels.v1` with their pane and terminal IDs; labels can contain whatever you type, so avoid secrets. Both are plaintext and local to the Herdr app home; they do not automatically sync across devices.
- Save per-space companion and decoration choices under `tinydust.farmStyle.v1` in `shared.json`: space IDs and appearance choices only. Invalid or newer-version appearance data is not overwritten. The journal uses Herdr's per-mod-copy `localStorage`, under `journal-v1`. Preferences use shared keys prefixed with `tinydust.`; space shortcuts read Herdr's existing `space.colors` without changing it.
- Keep data **on this device, in plaintext**. There is no cloud sync, encryption, or automatic journal backup. Other trusted software on your device can access it. Don't use it as a secret store.

Back up your Herdr config's `data/` directory and `shared.json` **privately** while Herdr is closed before removing/reinstalling a mod or migrating machines. The journal is in `data/`; grove history, pane labels, and farm choices are in `shared.json`. Don't commit either to Git. Herdr saves shared state asynchronously and does not report disk-write failures to mods; keep backups. Multiple independent app instances using one home have last-write-wins behavior. A cloned layout or a second journal mod instance may have its own storage; TinyDust is not a multi-window collaborative notebook.

If stored data is malformed, TinyDust shows an error and refuses to replace it. If saving fails, the journal reports it—keep the panel open and copy the notes somewhere safe. This first version has a 500-task limit, a 240-character task-title limit, and no delete/edit/export UI; completed tasks can be reopened.

Herdr's own network, telemetry, notifications, shipped mods, and remote-machine behavior are separate from TinyDust. Quiet view does not silence Herdr's built-in sounds or notifications; configure those in **Settings → Alerts**.

## Develop

No npm dependencies or build step are needed to run the layout. Node.js 22+ is used only for tests; Python 3 generates the original SVG, installs files, and runs the optional Usage scanner.

```sh
npm test
python3 -m unittest discover -s tests -p '*_test.py' -v
python3 scripts/draw-art.py
python3 scripts/draw-characters.py
python3 scripts/draw-farm-details.py
python3 scripts/install.py --update
herdr-app check ~/.config/herdr-app/mods/tinydust
herdr-app check ~/.config/herdr-app/mods/tinydust-journal
herdr-app check ~/.config/herdr-app/mods/tinydust-spaces
python3 scripts/check-native.py
```

| Path | Purpose |
| --- | --- |
| `layouts/tinydust.json` | Window arrangement and mod slots |
| `themes/tinydust.json` | Rose, lilac, and sage terminal/panel colors |
| `mods/tinydust/` | Brand, interactive farm, character poses, and notification skin |
| `mods/tinydust/game.js` | Pure status, character, grove display, pagination, and positioning rules |
| `mods/tinydust/grove.js` | Validated per-space grove history and reset rules |
| `mods/tinydust/noticeboard.js` | Live, cross-space agent noticeboard |
| `mods/tinydust/farm-style.js` / `farm-style-ui.js` | Validated per-space companion and decoration choices |
| `mods/tinydust/scene.js` | Native scene drawing, working/resting/cheering poses, interaction targets |
| `mods/tinydust/toast.js` | Existing Herdr notifications in TinyDust style |
| `mods/tinydust/creation.js` | Unified creation menu with captured/stale-target checks |
| `mods/tinydust/labels.js` | Validated local labels keyed to exact pane and terminal pairs |
| `mods/tinydust/pane-ui.js` | TinyDust pane header and context-menu entry points |
| `mods/tinydust/usage-ui.js` | On-demand usage dialog and validated summaries |
| `mods/tinydust/usage_scan.py` | Independent, bounded local usage scanner and optional public pricing |
| `mods/tinydust/spaces.js` | Colorful space shortcuts and compact rail using Herdr's existing color assignments |
| `mods/tinydust/space-status.js` | Per-space status aggregation and high-contrast symbols |
| `mods/tinydust-spaces/` | Named Spaces list adapted from Herdr 0.1.16, with the same status symbols |
| `mods/tinydust/fonts/` | Nads Handwriting and Silkscreen, with their separate notices |
| `mods/tinydust/workbench.js` | Decorative workbench trim; uses the original pixel sprout SVG |
| `mods/tinydust/logo.svg` | Original pixel cottage and sparkle mark |
| `mods/tinydust-journal/` | Notes, tasks, Quiet view, storage |
| `scripts/draw-art.py` | Deterministic, dependency-free farm SVG source |
| `scripts/draw-characters.py` | Eight characters, work/rest/cheer poses, and lineup |
| `scripts/draw-farm-details.py` | Original companion and garden-detail sprites |
| `scripts/check-native.py` | Populated, animated scene and toast checks in Herdr |
| `scripts/make-chime.py` | Original synthesized chime source; rebuilding requires ffmpeg |
| `scripts/completion_sound.py` | Default sound policy and backed-up settings update |
| `scripts/space_state.py` | Guarded one-time migration of native Spaces list preferences |
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

Fifty-three Node test cases cover the cross-space noticeboard, per-space farm choices, companion motion and demo safety, compact shortcuts, themed-symbol contrast, the named space list, distinct simultaneous status symbols and motion preferences, stable pixel vegetable icons, the opt-in farm dance and Quiet view, on-demand usage UI, scan routing and demo isolation, pane-label storage, target validation, concurrent-edit protection, menu delegation and sidebar display, compact space/agent icons, sidebar view switching, collapse/expand, width restoration and macOS traffic-light handling, responsive logo and full-name behavior, persistent grove storage, per-space clearing and corrupt-data protection, compact-scene geometry and paging, space shortcuts and stale/demo targets, title-font settings, decorative workbench layout and pane-header controls, creation-menu routing and stale/demo targets, journal storage and undo, missing/corrupt data, save failures, demo isolation, exact agent focus, live tree counts and limits, pagination, stable characters, pose assets, Quiet view/motion, tree interactions, and Herdr's info-level completion toast format. Render tests use host doubles, not a full GUI driver. All three mods pass Herdr's native check; additional fixtures check populated animated scenes, notification variants, the creation menu, pane header and menu, workbench trim, expanded/compact spaces, the brand, font menu, and grove confirmation. Creation routing is tested with host doubles; tests do not open real tabs or shells. Thirty-three Python tests cover synthetic usage fixtures, privacy, deduplication, optional pricing and scan limits, plus sound selection, Spaces-state migration, settings preservation, backups, failure cleanup, and sandboxed installation. The installer tests also cover preserving existing font preferences and equivalent layout JSON, skipping unchanged files, and preserving an installed file when replacement fails. The MP3 was decoded and measured locally (1.2 seconds, approximately −17.5 dBFS peak, no clipping); playback through the user's speakers was not auditioned. The workbench, expanded and collapsed sidebar, title font, logo, pane header, pane menu, label dialog, usage views, and sample font menu were visually inspected using sample data on Linux, not actual terminal output; collapse commands and macOS rail sizing were exercised with host doubles. Sample dance, space-symbol, noticeboard, companion and decoration views were inspected in Herdr, including nested sample dialogs; interactive board, appearance, dance, character and named-list actions were tested with host doubles, not a GUI driver. Usage parsing is tested with synthetic fixtures and an offline local scan; optional network pricing is tested with a mock, not a live request. Pane-menu routing, stale targets and header controls are tested with host doubles; full right-click GUI interaction, keyboard/screen-reader behavior, split-pane interaction, full app-restart persistence, end-to-end notification delivery, constrained-window visual inspection, and cross-platform testing remain outstanding.

## Credits and license

Inspired by the cozy farming-sim genre and the idea of agents as little characters in [Pixel HQ](https://github.com/bnhan2710/pixel-hq). The interactive farm also takes design inspiration from [World of Codecraft](https://github.com/kevinpardo/world-of-codecraft): status-specific work/rest areas, completion markers, clickable characters, and a larger world view. TinyDust's implementation, artwork, and synthesized chime are original; no World of Codecraft code, art, fonts, integrations, or hooks are bundled. No Stardew Valley or Harvest Moon assets, names, music, or characters are bundled; this is not affiliated with either game.

TinyDust's original code and art are [MIT licensed](LICENSE). The pane header includes behavior adapted from [Herdr's pane mod](https://github.com/herdrdev/herdr-app/blob/v0.1.16/defaults/mods/pane/main.js), under the [Apache 2.0 license](mods/tinydust/HERDR-PANE-LICENSE.txt); TinyDust modifies it for labels and accessible controls. The named space list is adapted from [Herdr's Spaces mod](https://github.com/herdrdev/herdr-app/blob/v0.1.16/defaults/mods/spaces/main.js), also under [Apache 2.0](mods/tinydust-spaces/HERDR-SPACES-LICENSE.txt), with status symbols added. **Nads Handwriting** was provided by its owner for inclusion and redistribution with TinyDust; it is not covered by the MIT license. See its [notice](mods/tinydust/fonts/NadsHandwriting-NOTICE.txt) for the stated permission. The bundled [Silkscreen](https://github.com/googlefonts/silkscreen) display font, by Jason Kottke and the Silkscreen Project Authors, is separately licensed under the [SIL Open Font License 1.1](mods/tinydust/fonts/OFL-Silkscreen.txt); it is redistributed unmodified from [Google Fonts](https://github.com/google/fonts/tree/7af0d90b4d532ffa4b041937b560c6df4e7b1e95/ofl/silkscreen). The TinyDust pane header references Herdr's built-in pane and status icons. Herdr and the shipped mods that the layout references are separate projects under their own licenses; they aren't bundled here.
