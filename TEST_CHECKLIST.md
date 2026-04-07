# Swimlane-Kanban Test Checklist

## Setup
- [ ] Plugin loads without errors (check Developer Console for exceptions)
- [ ] Opening a file with `swimlane-kanban: board` frontmatter shows the kanban view
- [ ] Opening a file without the frontmatter shows normal markdown view

---

## Drag and Drop — Cards
- [ ] Dragging a card title shows a drag overlay (ghost card follows cursor)
- [ ] Dragging a card within the same column reorders it correctly
- [ ] Dragging a card up (to an earlier position) places it before the target card
- [ ] Dragging a card down (to a later position) places it after the target card
- [ ] Dragging a card to the empty space at the bottom of a column (sort placeholder) appends it
- [ ] Dragging a card to a different column in the same swimlane works
- [ ] Dragging a card to a column in a different swimlane works
- [ ] Releasing mid-air (no valid drop target) returns the card to its original position
- [ ] Clicking the checkbox does NOT start a drag
- [ ] Clicking the card title starts drag after a short move (> 5px)

## Drag and Drop — Visual Feedback
- [ ] Other cards in the column shift to make room during drag
- [ ] A sort placeholder (empty space) appears at the drop target position
- [ ] Drag overlay disappears cleanly after drop
- [ ] Cards animate back smoothly when drag is cancelled

---

## Cards (CRUD)
- [ ] "Add card" form appears at the bottom of each column
- [ ] Submitting the form adds a card to the bottom of the column
- [ ] Right-clicking a card shows a context menu
- [ ] "Edit card..." opens a modal with the current title pre-filled
- [ ] Editing saves the new title
- [ ] "Delete card" removes the card
- [ ] Checking/unchecking the card checkbox updates the checked state
- [ ] Board markdown file is updated on disk after each change

---

## Columns (CRUD)
- [ ] Right-clicking the column header shows a context menu
- [ ] "Rename column..." opens a modal and renames the column
- [ ] "Set WIP limit..." opens a modal and sets a WIP limit
- [ ] "Remove WIP limit" clears the WIP limit
- [ ] "Delete column" removes the column and all its cards
- [ ] WIP badge shows current card count vs. limit (e.g. "2/3")
- [ ] Column header turns red/highlighted when at or over WIP limit

---

## Swimlanes (CRUD)
- [ ] Right-clicking a swimlane header shows a context menu
- [ ] "Add column..." opens a modal and adds a new column
- [ ] "Rename swimlane..." opens a modal and renames it
- [ ] "Delete swimlane" removes the swimlane and all its columns/cards
- [ ] Collapse/expand button toggles swimlane content
- [ ] Card count in swimlane header updates when cards are added/removed

---

## Board Form
- [ ] "Add swimlane" form at the bottom of the board works
- [ ] Submitting adds a new swimlane with default columns (if configured)

---

## Settings
- [ ] Settings tab appears in Obsidian settings under the plugin
- [ ] "Column width" setting changes the rendered column width
- [ ] "Default WIP limit" is applied to new columns when added via swimlane context menu
- [ ] "Default columns" are created when a new swimlane is added

---

## File / Persistence
- [ ] All board changes (DnD moves, edits, deletions) persist after closing and reopening the file
- [ ] The markdown format is valid: H1 = swimlane, H2 = column, `- [ ]` = card
- [ ] WIP limit is preserved in markdown as `## Column Name [wip:N]`
- [ ] "Open as markdown" shows the raw markdown correctly
- [ ] Switching back to kanban view from markdown reflects any manual edits

---

## Edge Cases
- [ ] Empty board (no swimlanes) renders without errors
- [ ] Swimlane with no columns renders without errors
- [ ] Column with no cards shows only the sort placeholder and add-card form
- [ ] Very long card titles don't break the layout
- [ ] Multiple swimlane-kanban boards can be open simultaneously
- [ ] Dragging between two simultaneously open boards works
