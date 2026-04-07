import { App, Notice, TFile } from 'obsidian';

const HEADING = '## KANBAN';

export async function sendToDailyNote(app: App, titles: string[]) {
  if (titles.length === 0) {
    new Notice('No items to send');
    return;
  }

  // Resolve daily note config
  const dailyNotesPlugin = (app as any).internalPlugins?.plugins?.['daily-notes'];
  const options = dailyNotesPlugin?.instance?.options || {};
  const folder: string = options.folder?.trim() || '';
  const format: string = options.format?.trim() || 'YYYY-MM-DD';

  // Build path using moment (globally available in Obsidian)
  const dateStr = (window as any).moment().format(format);
  const filePath = folder ? `${folder}/${dateStr}.md` : `${dateStr}.md`;

  const items = titles.map((t) => `- [ ] ${t}`).join('\n');

  const existing = app.vault.getAbstractFileByPath(filePath);
  if (existing && existing instanceof TFile) {
    const content = await app.vault.read(existing);
    if (content.includes(HEADING)) {
      // Find the heading and append items right after it (before next heading or EOF)
      const headingIndex = content.indexOf(HEADING);
      const afterHeading = headingIndex + HEADING.length;
      // Find the next heading (## or #) or EOF
      const rest = content.slice(afterHeading);
      const nextHeadingMatch = rest.match(/\n(#{1,6} )/);
      const insertAt = nextHeadingMatch
        ? afterHeading + nextHeadingMatch.index!
        : content.length;
      const updated =
        content.slice(0, insertAt).trimEnd() + '\n' + items + '\n' + content.slice(insertAt);
      await app.vault.modify(existing, updated);
    } else {
      // Append heading + items at the end
      await app.vault.append(existing, '\n' + HEADING + '\n' + items + '\n');
    }
  } else {
    // Ensure folder exists
    if (folder) {
      const folderObj = app.vault.getAbstractFileByPath(folder);
      if (!folderObj) {
        await app.vault.createFolder(folder);
      }
    }
    await app.vault.create(filePath, HEADING + '\n' + items + '\n');
  }

  new Notice(`Sent ${titles.length} item${titles.length === 1 ? '' : 's'} to daily note`);
}
