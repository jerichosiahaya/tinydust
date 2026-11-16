# TinyDust

A quiet farming-inspired Herdr window. A little orchard and farmhouse sit above live agent farmers on the left, real terminals fill the middle, and a field journal keeps one current task and a scratchpad on the right.

![TinyDust, captured in Herdr with sample data](preview.png)

## What you see

- A 300px left sidebar (resizable 44–480), a 46px TinyDust brand row with a Journal toggle, Herdr's Spaces block initially 150px tall, then the farm and agent list. Herdr's settings/machine footer stays at the bottom.
- Original 160×112 logical-pixel farm illustration, scaled as a crisp SVG to the panel width. Warm daylight from the upper left creates stepped highlights, darker right faces, contact shadows, and offset cast shadows. House, orchard, tilled beds, path, pond, cat. No borrowed game assets.
- 80px agent rows with a shaded farmer sprite, readable agent name, explicit status, tab name, and address. Narrow rails show status symbols. Small or Quiet panels omit the landscape.
- Center: Herdr's 42px tab bar, active tab's normal terminal splits with 30px pane headers and 6px corner radius, optional Files/Changes panels, and a 28px status bar.
- Right: a 320px Field journal (resizable 280–460). Only the Now card has an accent outline. Below: next-step input/list, 180px multiline scratchpad, collapsed completed list, and gentle guidance.
- Palette: terminal `#232720`, text `#f2e6c9`, chrome `#2c3024`, accent `#e6bd76`. Muted labels remain legible. Keep the user's terminal/UI fonts.

## How it behaves

- Read only agents in the active space. Preserve their Herdr order; include other spaces after them in keyboard agent navigation. Clicking a farmer uses `agent.focus` with that exact terminal address.
- Working: watering-can farmer, optional 2px vertical motion. Blocked: an exclamation mark and “Needs you.” Done: a harvest basket and “Done.” Idle: still, labeled resting. Unknown remains explicit.
- Motion is off initially. Native `.loop()` only, no timer redraw loop. Quiet view also suppresses animation.
- Add a task with Enter or Add step. Empty and >240-character titles produce an inline message. At most 500 retained tasks. One task may be Now. Completing it empties Now rather than promoting another task. Reopen completed tasks. Undo only the last completion/reopening and don't lose subsequent tasks or notes.
- Notes save on change. Data is one device-local journal for this layout across spaces, not per project. Validate storage; a missing key is a fresh journal, a malformed value is an error and must never be overwritten automatically. A save error must not erase draft input or pretend it saved.
- Quiet view hides scenery, next-step list, and completed list; retains Now, notes, and agent statuses. Show more restores them. Do not add deadlines, streaks, nagging sounds, or rewards.
- Journal button toggles the right panel. Keep normal Herdr terminals and controls working.

## Built from

- `layouts/tinydust.json`: root row → sidebar + work column; work body row → active tab, hidden Files/Changes stack, journal.
- `themes/tinydust.json`: ANSI palette and semantic chrome colors.
- `mods/tinydust`: a View with optional `role: "brand"`; otherwise farm/agents. `agents`, `spaces`, `theme`, `shared`, `setShared`, `setAgentOrder`, `run`, `props`. Shared `tinydust.motion` and `tinydust.quiet` booleans.
- `mods/tinydust-journal`: native InputState, TextareaState, Buttons; JSON validation and immutable task operations in `state.js`. Per-copy localStorage `journal-v1`, schema `{version:1, notes, tasks:[{id,text,done}], now}`. Journal focus command focuses its task input, or notes in Quiet view.
- Shipped mods are referenced, not copied: `spaces`, `tabs`, `pane`, `files`, `changes`, `workspace-chrome`, `workspace-status`.
- Mods have no network requests, subprocesses, agent plugins, or project file reads. Python installer copies only the source assets and runs native checks. Art generator uses only Python's standard library.

## Watch out

- Herdr missing localStorage keys can be `undefined`, not just `null`.
- `nextCommand()` resolves a string. A focusable mod must respond to `"focus"`.
- GPUI is native, not HTML/CSS. Test against the installed generated types. `herdr-app check` does not exercise every live state.
- Keep the Now card's child chain closed before rendering the rest of the journal; don't accidentally outline everything.
- Herdr mod storage is plaintext and per copy. Never publish config `data/`, `shared.json`, keys, or real terminal screenshots. Sample screenshot props must never read/write the personal journal or focus a real agent.
- The current version has no task edit/delete or journal export/sync. Quiet view does not disable Herdr's own notifications. Screen-reader and cross-platform behavior still need testing.
- README screenshot uses explicit sample data and a screenshot-only welcome panel in place of terminals. Never imply these are real agent activity.

## Done when

1. Both mods pass `herdr-app check`; live layout has no errors and opens with an empty journal on first use.
2. Node tests pass for persistence, corruption, undo, single Now task, save failures, demo isolation, garden filtering, focus targets, compact mode, and motion preferences.
3. Real terminals remain usable; no existing layout, keyboard shortcut, or task is overwritten.
4. Inspect a full native capture for clipping/contrast. Confirm the public screenshot contains only sample data and is labeled accordingly.
5. Confirm normal mode and Quiet view offer a clear next action without moving, flashing, or automatically promoting tasks.
