# Swimlane Kanban

An Obsidian plugin providing Kanban boards with swimlanes, WIP limits, and per-swimlane columns.

## Features

- **Swimlanes** — group columns under named swim lanes (H1 headings in markdown)
- **Columns** — per-swimlane columns with optional WIP limits (H2 headings)
- **Cards** — task items stored as `- [ ]` / `- [x]` markdown list items
- **Drag & Drop** — reorder cards within and across columns/swimlanes
- **WIP limits** — visual badge and highlight when a column is at/over limit
- **CRUD** — add, rename, and delete cards, columns, and swimlanes via context menus

## Board File Format

A board file must have `swimlane-kanban: board` in its frontmatter:

```markdown
---
swimlane-kanban: board
---

# Swimlane One

## To Do [wip:3]
- [ ] Task A
- [ ] Task B

## In Progress [wip:1]
- [ ] Task C

## Done
- [x] Task D

# Swimlane Two

## Backlog
- [ ] Task E
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/AnythingMapping/swimlane-kanban
cd swimlane-kanban
npm install
```

### Build

```bash
# Production build (minified, no source maps)
npm run build

# Development build (watch mode, inline source maps)
npm run dev

# Type check only
npm run typecheck
```

Build outputs `main.js` and `styles.css` to the project root.


Once built, ctrl p and reload the app or close and re-open obsidian
## Deployment

### Manual deploy to a vault

Copy the three required files to your vault's plugin directory:

```
<vault>/.obsidian/plugins/swimlane-kanban/
  main.js
  styles.css
  manifest.json
```

### Deploy script

A helper script is included for deploying to the local vault. Edit the `VAULT` path at the top of `deploy.sh` to match your vault location, then run:

```bash
bash deploy.sh
```

The script creates the plugin directory if it does not exist and copies `main.js`, `styles.css`, and `manifest.json`.

### Typical workflow

```bash
npm run build && bash deploy.sh
```

After deploying, reload Obsidian (or use **Settings → Community plugins → Reload**) and enable **Swimlane Kanban** in the plugin list.

### Enable the plugin in Obsidian

1. Open **Settings** → **Community plugins**
2. Disable **Safe mode** if prompted
3. Find **Swimlane Kanban** in the installed plugins list and toggle it on

## Usage

1. Create a new note in your vault
2. Add `swimlane-kanban: board` to the frontmatter
3. The note will open automatically as a Kanban board
4. Use right-click context menus to add/rename/delete columns and swimlanes
5. Drag cards between columns and swimlanes

## Acknowledgements

Drag-and-drop system adapted from [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban) by mgmeyers (MIT License).

## License

[MIT](LICENSE)
