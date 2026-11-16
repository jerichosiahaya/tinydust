# TinyDust

**A little room to focus.** A cozy, 8-bit-inspired [Herdr](https://herdr.dev) layout: agents in the garden, one next step, and somewhere to park a thought.

![TinyDust in Herdr: an interactive pixel farm in the sidebar, an expanded sample farm with working and resting characters in the center, and a simple Now-and-notes journal on the right.](preview.png)

*Captured in Herdr with labeled sample agents, tasks, and workspace. The center demonstrates the expanded farm; normally your terminals live there and “Visit farm” opens the larger scene in a dialog. No personal notes, conversations, or project names are included.*

## A small, useful place

- **Original pixel farm.** A tiled roof, vegetable beds, orchard, pond, and a sleeping cat. Stepped highlights, contact shadows, and diagonal cast shadows add depth without blurring the pixels. No ripped game assets.
- **Eight little characters.** A cat, rabbit, fox, bear, frog, duck, farmer, and gardener. Each agent gets a stable character based on its terminal address—not its position in the list. Click the portrait to focus that agent. Working, needs-you, done, and idle are written out, not just color-coded.
- **A little working world.** Characters water crop plots, rest on picnic blankets, wait at a help sign, or throw their arms up with **“Finished!”**. Click a character or its nameplate to focus the real agent. **Visit farm** opens a larger interactive scene; Escape or Back to work closes it.
- **A grove that follows activity.** Each currently working agent in this space adds one tree. Tap a tree to see who it belongs to—and make it shake with motion enabled. Trees reflect current activity, not cumulative achievements or a productivity score.
- **Completion you can notice.** Finished characters cheer and display a speech bubble. Herdr's existing completion toast gets a TinyDust portrait and “Harvest ready” styling; clicking it focuses that agent. Existing Herdr sounds are respected, with no second notification or extra loud sound.
- **A softer palette.** Dusty rose, lilac, sage, apricot, and denim blue, grounded by warm charcoal. Colorful and a little sweet without turning everything pink.
- **A simpler journal.** Just **Now** and **Notes** up front. Notes save locally as you type. Expand **Tasks** when you need the list; it starts folded away. The same journal follows you across spaces.
- **Small tasks, fewer buttons.** Expand Tasks, type a step and press Enter or Add. Use **Focus** to make it your one Now task, or the circle to complete it. Completed tasks can be reopened; the last completion can be undone.
- **Quiet view.** Hides the landscape and next-step/completed lists, while keeping your current task, notes, and agent statuses accessible. “Show more” brings everything back.
- **Motion off by default.** Turn it on for two-frame watering, falling droplets, gentle movement, cheering, and tree shakes. Quiet view suppresses motion; **Resume game** explicitly leaves Quiet view and enables it. No frame-polling loops, confetti, or flashing help markers.
- **Your normal workspace.** Herdr's tabs, pane controls, files, changes, spaces, and status bar remain available. The **Journal** button hides or shows the right sidebar.

### Meet the crew

![Eight original pixel characters: Miso, Clover, Maple, Cocoa, Fern, Sunny, Rowan, and Sage.](mods/tinydust/characters.svg)

**Miso** the cat · **Clover** the rabbit · **Maple** the fox · **Cocoa** the bear · **Fern** the frog · **Sunny** the duck · **Rowan** the farmer · **Sage** the gardener.

Character names appear in portrait tooltips. They're visual companions, not extra agents. Different terminals may share a character; the cast does not impose an agent limit. The farm shows six characters per page (three in shorter sidebar panels); Previous/Next reaches the rest. Up to 24 trees are drawn, with the exact total and visible count stated when that limit is reached.

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

Review the installer before running it. It copies only TinyDust's layout, theme, preview art, and two mods into your Herdr config, then checks the mods. It refuses to overwrite existing TinyDust files unless you pass `--update`. It does not change your keyboard shortcuts, other layouts, or terminal sessions.

You can also select **tinydust** in **Settings → Look**. If new mods aren't discovered immediately, restart Herdr once.

### Update

```sh
git pull --ff-only
python3 scripts/install.py --update
```

The installer backs up replaced code under `~/.config/herdr-app/backups/tinydust-<timestamp>/`. Your journal lives in Herdr's runtime storage, not these source files. Updates don't intentionally modify it. Back up that storage separately before changing or deleting mods.

### Controls

| Action | How |
| --- | --- |
| Focus an agent | Click its scene character, nameplate, or list row |
| Open the larger farm | Visit farm; Escape or Back to work to leave |
| Inspect/shake a tree | Click a tree; shaking requires Motion on |
| See more farmhands | Previous / Next under the scene |
| Open the task list | Tasks, below Notes |
| Add a task | Type a small step, then Enter or Add |
| Pick the current task | Focus |
| Put it back in the list | Later |
| Complete / restore | Done on the Now card; circle/checkmark on a task row; Undo last completion |
| Reduce visual load | Quiet view; Show more to return |
| Toggle notes sidebar | Journal, in the top-left brand bar |
| Animate the game | Motion on; off initially. Resume game leaves Quiet view and enables motion |
| Configure completion sounds | Settings → Alerts, or Alert settings in Visit farm |
| Navigate journal controls | Native buttons and inputs support keyboard focus; Enter submits a task |

On a narrow window, hide the journal or collapse Herdr's sidebar. Small garden panels omit the landscape. The task list and scratchpad remain scrollable. This is a desktop layout, not a mobile UI.

## Privacy and storage

**Herdr mods are trusted, unsandboxed code. Read them before installing.**

TinyDust's two runtime mods:

- Make **no network requests**, spawn **no programs**, install **no agent plugins**, and do not read terminal output or project files.
- Read Herdr's agent/space state to draw the farm, and existing notification payloads to style toasts. Issue normal focus/layout/overlay commands when clicked; no duplicate completion notifications are generated.
- Save the journal with Herdr's per-mod-copy `localStorage`, under the `journal-v1` key. Preferences use shared keys prefixed with `tinydust.`.
- Keep data **on this device, in plaintext**. There is no cloud sync, encryption, or automatic journal backup. Other trusted software on your device can access it. Don't use it as a secret store.

Back up your Herdr config's `data/` directory **privately** while Herdr is closed before removing/reinstalling a mod or migrating machines. Don't commit it to Git. A cloned layout or a second journal mod instance may have its own storage; TinyDust is not a multi-window collaborative notebook.

If stored data is malformed, TinyDust shows an error and refuses to replace it. If saving fails, the journal reports it—keep the panel open and copy the notes somewhere safe. This first version has a 500-task limit, a 240-character task-title limit, and no delete/edit/export UI; completed tasks can be reopened.

Herdr's own network, telemetry, notifications, shipped mods, and remote-machine behavior are separate from TinyDust. Quiet view does not silence Herdr's built-in sounds or notifications; configure those in **Settings → Alerts**.

## Develop

No npm dependencies or build step are needed to run the layout. Node.js 22+ is used only for tests; Python 3 generates the original SVG and installs files.

```sh
npm test
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
| `mods/tinydust/game.js` | Pure status, character, grove, pagination, and positioning rules |
| `mods/tinydust/scene.js` | Native scene drawing, working/resting/cheering poses, interaction targets |
| `mods/tinydust/toast.js` | Existing Herdr notifications in TinyDust style |
| `mods/tinydust-journal/` | Notes, tasks, Quiet view, storage |
| `scripts/draw-art.py` | Deterministic, dependency-free farm SVG source |
| `scripts/draw-characters.py` | Eight characters, work/rest/cheer poses, and lineup |
| `scripts/check-native.py` | Populated, animated scene and toast checks in Herdr |
| `scripts/screenshot.py` | Temporary sample-data preview; restores the previous layout |
| `tests/` | State/render tests, native fixtures, and sample screenshot chrome |
| `RECIPE.md` | Brief for rebuilding or remixing the layout |

To regenerate the README screenshot, install TinyDust, open Herdr at a comfortable desktop size (the current capture is 1920×1046), close overlays, then run:

```sh
python3 scripts/screenshot.py
```

The script temporarily switches layouts, substitutes sample data and the expanded farm for private content, captures `preview.png`, then restores the previous layout. **Always inspect the whole image before publishing it.**

### Validation

Nine automated test cases cover journal storage and undo, missing/corrupt data, save failures, demo isolation, exact agent focus, live tree counts and limits, pagination, stable characters, pose assets, Quiet view/motion, tree interactions, and Herdr's info-level completion toast format. Render tests use host doubles, not a full GUI driver. Both mods pass Herdr's native check; an additional fixture checks populated animated scenes and notification variants. Live and sample-data layouts were visually inspected on Linux. Full keyboard/screen-reader, end-to-end notification delivery, and cross-platform testing remain outstanding.

## Credits and license

Inspired by the cozy farming-sim genre and the idea of agents as little characters in [Pixel HQ](https://github.com/bnhan2710/pixel-hq). The interactive farm also takes design inspiration from [World of Codecraft](https://github.com/kevinpardo/world-of-codecraft): status-specific work/rest areas, completion markers, clickable characters, and a larger world view. TinyDust's implementation and artwork are original; no World of Codecraft code, art, fonts, integrations, or hooks are bundled. No Stardew Valley or Harvest Moon assets, names, music, or characters are bundled; this is not affiliated with either game.

TinyDust is [MIT licensed](LICENSE). Herdr and the shipped mods that the layout references are separate projects under their own licenses; they aren't bundled here.
