# Swimlane Kanban — Obsidian Plugin Store Release Checklist

> Reference: [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin) · [Submission requirements](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins) · [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) · [Developer policies](https://docs.obsidian.md/Developer+policies)

---

## 1. Repository & Files

- [ ] Plugin is hosted in a **public GitHub repository**
- [ ] `manifest.json` exists at the **repo root**
- [ ] `main.js` exists at the **repo root** (built artifact)
- [ ] `styles.css` exists at the **repo root** (built artifact)
- [ ] `README.md` exists at the **repo root**
- [x] `LICENSE` file exists at the **repo root** — MIT license added
- [ ] `versions.json` is present and up to date

---

## 2. manifest.json

- [ ] `id` is unique, lowercase/hyphenated, and does **not** contain the word "obsidian"
- [ ] `name` is set correctly (`"Swimlane Kanban"`)
- [x] `author` field is **filled in** — set to `"Lucas"` with `authorUrl` pointing to GitHub
- [ ] `description` is concise (max 250 chars), starts with a verb, ends with a period, no emoji
  - Current: `"Kanban boards with swimlanes, WIP limits, and geo hooks."` — looks good, verify length
- [ ] `version` matches the GitHub release tag exactly (no `v` prefix) — currently `0.1.0`
- [ ] `minAppVersion` is set to the lowest Obsidian version you actually tested against — currently `1.0.0`
- [x] `isDesktopOnly` is correct — set to `true` (desktop only)
- [ ] Add `authorUrl` (GitHub profile or website) — optional but recommended
- [ ] Add `fundingUrl` if you accept donations, or omit it entirely

---

## 3. README.md

- [ ] Clearly describes what the plugin does
- [ ] Includes usage instructions (board file format, frontmatter, context menus)
- [ ] Includes screenshots or a GIF demo of the board in action — **DO LAST: capture video/GIF of usage first**
- [ ] Documents all settings (column width, default columns, default WIP)
- [ ] Mentions any known limitations or caveats
- [ ] If any paid features, remote services, or external data are used — document them explicitly
- [x] Remove references to `<repo-url>` placeholder in the Setup section — replaced with actual GitHub URL

---

## 4. Code Quality (Plugin Guidelines)

- [x] No use of `innerHTML`, `outerHTML`, or `insertAdjacentHTML` with user-controlled input
- [x] All DOM construction uses `createEl()`, `createDiv()`, `createSpan()` or the DOM API
- [x] No hardcoded inline CSS styles — use CSS classes and Obsidian CSS variables
- [x] CSS uses Obsidian variables (e.g. `--text-normal`, `--background-modifier-error`) for theming
- [x] No use of `var` — use `const`/`let` throughout
- [x] Uses `async/await` instead of raw Promise chains
- [x] No regex with lookbehind assertions (mobile compatibility)
- [x] `this.app` used instead of the global `app` object
- [x] No unnecessary `console.log` calls left in production code (errors only)
- [x] Event listeners are cleaned up on plugin unload (via `registerEvent()` or `addCommand()`)
- [x] `onunload` does **not** call `leaf.detach()`
- [x] Settings headings use `setHeading()` API — fixed `createEl('h2')` in `Settings.ts:18`
- [x] Settings UI text uses sentence case
- [x] Commands do **not** have default hotkeys assigned

---

## 5. Developer Policies Compliance

- [ ] Code is **not obfuscated**
- [ ] No telemetry or client-side tracking
- [ ] No mechanism for auto-updating the plugin outside Obsidian's update system
- [ ] No dynamic ads loaded from the internet
- [ ] `main.js` does not load remote resources at runtime (beyond user-configured integrations)
- [ ] No use of "Obsidian" in the plugin name in a way that implies first-party status
- [ ] Licenses of all bundled third-party libraries are compatible and properly attributed

**Third-party dependencies to verify:**
- `preact` — MIT
- `box-intersect` — MIT
- `classcat` — MIT
- `eventemitter3` — MIT
- `immutability-helper` — MIT
- `monkey-around` — MIT

---

## 6. Functionality & Testing

Work through the full `TEST_CHECKLIST.md` before submitting. Key areas:

- [ ] Plugin loads and unloads without errors in Obsidian console
- [ ] Board renders correctly from a valid board file
- [ ] Non-board files open as normal markdown (no view override)
- [ ] Drag & drop works: within column, cross-column, cross-swimlane
- [ ] WIP limits display badge and highlight at/over limit
- [ ] All CRUD operations work: add/rename/delete cards, columns, swimlanes
- [ ] Collapse/expand swimlanes works
- [ ] All changes persist correctly to disk in valid markdown
- [ ] Settings tab loads and all settings apply correctly
- [ ] **Mobile**: test on Obsidian mobile OR set `isDesktopOnly: true` in manifest

---

## 7. Build & Release

- [x] Run `npm run typecheck` — zero TypeScript errors (fixed 8 errors)
- [x] Run `npm run build` — production build succeeds, no warnings
- [x] `main.js` is the **minified** production build (not dev build with source maps)
- [ ] `styles.css` is compiled and up to date
- [ ] Bump `version` in `manifest.json` to your release version
- [ ] Add the new version to `versions.json` with the required `minAppVersion`
- [ ] Create a **GitHub Release** with a tag matching the version (e.g. `1.0.0`, not `v1.0.0`)
- [ ] Attach `main.js`, `manifest.json`, and `styles.css` as **individual file attachments** to the release (not just the source ZIP)
- [ ] Release notes describe what the plugin does (for first release)

---

## 8. Plugin Store Submission

- [ ] Fork [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases)
- [ ] Add an entry to `community-plugins.json` with:
  ```json
  {
    "id": "swimlane-kanban",
    "name": "Swimlane Kanban",
    "author": "<your name>",
    "description": "Kanban boards with swimlanes, WIP limits, and geo hooks.",
    "repo": "<your-github-username>/swimlane-kanban"
  }
  ```
- [ ] Open a pull request titled `Add plugin: Swimlane Kanban`
- [ ] Check all required checkboxes in the PR template
- [ ] Wait for the automated validation bot — resolve any "Validation failed" issues
- [ ] Respond to any reviewer feedback and update the release accordingly
- [ ] Comment on the PR when revisions are complete

---

## 9. Post-Publication (Optional but Recommended)

- [ ] Announce in the [Obsidian forum Share & Showcase](https://forum.obsidian.md/c/share-showcase/9)
- [ ] Post in the Obsidian Discord `#updates` channel (requires developer role)
- [ ] Tag the repository with the `obsidian-plugin` GitHub topic

---

## Notes

> **README last** — Complete all other sections first. Then record a video/GIF demo of the plugin in use (board creation, drag & drop, WIP limits, context menus) and embed it in the README alongside the settings documentation.

---

## Summary of Blocking Issues

These must be fixed before submitting:

| # | Issue | Status | Location |
|---|-------|--------|----------|
| 1 | `author` field is empty | ✅ Fixed | `manifest.json` |
| 2 | No `LICENSE` file | ✅ Fixed | repo root |
| 3 | `<repo-url>` placeholder not replaced | ✅ Fixed | `README.md` |
| 4 | Mobile compatibility unverified (`isDesktopOnly: false`) | ✅ Fixed — set to `true` | `manifest.json` |
| 5 | No screenshots/GIFs in README | ⏳ Do last — record video/GIF first | `README.md` |
| 6 | 8 TypeScript errors | ✅ Fixed | `src/` |
