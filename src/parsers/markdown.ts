import {
  Board,
  BoardData,
  BoardTemplate,
  Column,
  ColumnTemplate,
  DataTypes,
  SprintConfig,
  SwimlaneKanbanSettings,
  Item,
  ItemTemplate,
  Swimlane,
  SwimlaneTemplate,
  generateInstanceId,
} from '../types';

export const frontmatterKey = 'swimlane-kanban';

export const basicFrontmatter = ['---', '', `${frontmatterKey}: board`, '', '---', '', ''].join(
  '\n'
);

const swimlaneRegex = /^#\s+Swimlane:\s*(.+?)(?:\s+\[color:(\w+)\])?\s*$/;
const columnRegex = /^##\s+(.+?)(?:\s+\[wip:(\d+)\])?(?:\s+\[width:(\d+)\])?\s*$/;
const itemRegex = /^(\s*)-\s+\[([ xX])\]\s+(.+)$/;
const scoreRegex = /\s*\[score::(\d+)\]/;
const priorityRegex = /\s*\[priority::([^\]]+)\]/;
const settingsStartRegex = /^%%\s*swimlane-kanban:settings\s*$/;
const settingsEndRegex = /^%%\s*$/;
const codeBlockRegex = /^```\s*$/;

export function parseMarkdown(md: string): Board {
  const lines = md.split('\n');

  const swimlanes: Swimlane[] = [];
  let settings: SwimlaneKanbanSettings = {};
  const errors: { description: string; stack: string }[] = [];
  let sprint: SprintConfig | undefined;

  let currentSwimlane: Swimlane | null = null;
  let currentColumn: Column | null = null;
  let currentItem: Item | null = null;
  let inSettings = false;
  let inCodeBlock = false;
  let inScaffold = false;
  let settingsJson = '';
  let descriptionLines: string[] = [];
  let scaffoldLines: string[] = [];

  const flushDescription = () => {
    if (currentSwimlane && descriptionLines.length > 0) {
      const desc = descriptionLines.join('\n').trim();
      if (desc) currentSwimlane.data.description = desc;
    }
    descriptionLines = [];
  };

  // Parse frontmatter for sprint config
  {
    let inFm = false;
    for (const line of lines) {
      if (line.trim() === '---') {
        if (inFm) break;
        inFm = true;
        continue;
      }
      if (!inFm) continue;
      const sprintNameMatch = line.match(/^sprint-name:\s*(.+)$/);
      const sprintDescMatch = line.match(/^sprint-description:\s*(.+)$/);
      const sprintStartMatch = line.match(/^sprint-start:\s*(.+)$/);
      const sprintEndMatch = line.match(/^sprint-end:\s*(.+)$/);
      if (sprintNameMatch || sprintDescMatch || sprintStartMatch || sprintEndMatch) {
        if (!sprint) sprint = {};
        if (sprintNameMatch) sprint.name = sprintNameMatch[1].trim();
        if (sprintDescMatch) sprint.description = sprintDescMatch[1].trim();
        if (sprintStartMatch) sprint.startDate = sprintStartMatch[1].trim();
        if (sprintEndMatch) sprint.endDate = sprintEndMatch[1].trim();
      }
    }
    // Validate: need both start and end, and end >= start
    if (sprint && sprint.startDate && sprint.endDate) {
      const s = new Date(sprint.startDate);
      const e = new Date(sprint.endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
        sprint = undefined;
      }
    } else if (sprint) {
      sprint = undefined;
    }
  }

  for (const line of lines) {
    // Skip frontmatter
    if (line.startsWith('---')) continue;
    if (line.startsWith(`${frontmatterKey}:`)) continue;
    if (/^sprint-(name|description|start|end):/.test(line)) continue;

    // Settings block detection
    if (settingsStartRegex.test(line)) {
      inSettings = true;
      continue;
    }

    if (inSettings) {
      if (codeBlockRegex.test(line)) {
        if (inCodeBlock) {
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (settingsEndRegex.test(line)) {
        inSettings = false;
        try {
          if (settingsJson.trim()) {
            settings = JSON.parse(settingsJson.trim());
          }
        } catch (e) {
          errors.push({ description: `Failed to parse settings: ${e}`, stack: '' });
        }
        continue;
      }

      settingsJson += line;
      continue;
    }

    // Scaffold block
    if (inScaffold) {
      if (line.trim() === '-->') {
        inScaffold = false;
        if (currentSwimlane) {
          const tasks = scaffoldLines.map(l => l.trim()).filter(l => l.length > 0);
          if (tasks.length > 0) currentSwimlane.data.scaffold = tasks;
        }
        scaffoldLines = [];
      } else {
        scaffoldLines.push(line);
      }
      continue;
    }
    if (line.trim() === '<!-- scaffold') {
      inScaffold = true;
      continue;
    }

    // Swimlane header
    const swimlaneMatch = line.match(swimlaneRegex);
    if (swimlaneMatch) {
      flushDescription();
      currentItem = null;
      if (currentColumn && currentSwimlane) {
        currentSwimlane.children.push(currentColumn);
      }
      if (currentSwimlane) {
        swimlanes.push(currentSwimlane);
      }
      currentColumn = null;
      currentSwimlane = {
        ...SwimlaneTemplate,
        id: generateInstanceId(),
        children: [],
        data: { title: swimlaneMatch[1].trim(), color: swimlaneMatch[2] || undefined },
      };
      continue;
    }

    // Column header
    const columnMatch = line.match(columnRegex);
    if (columnMatch) {
      flushDescription();
      currentItem = null;
      if (currentColumn && currentSwimlane) {
        currentSwimlane.children.push(currentColumn);
      }
      const wipLimit = columnMatch[2] ? parseInt(columnMatch[2], 10) : undefined;
      const width = columnMatch[3] ? parseInt(columnMatch[3], 10) : undefined;
      currentColumn = {
        ...ColumnTemplate,
        id: generateInstanceId(),
        children: [],
        data: { title: columnMatch[1].trim(), wipLimit, width },
      };
      continue;
    }

    // Item (with optional leading whitespace for sub-items)
    const itemMatch = line.match(itemRegex);
    if (itemMatch && currentColumn) {
      const indent = itemMatch[1].length;
      const checked = itemMatch[2] !== ' ';
      let title = itemMatch[3];
      let score: number | undefined;

      const scoreMatch = title.match(scoreRegex);
      if (scoreMatch) {
        const val = parseInt(scoreMatch[1], 10);
        if (val >= 0 && val <= 10) score = val;
        title = title.replace(scoreRegex, '').trim();
      }

      let priority: string | undefined;
      const priorityMatch = title.match(priorityRegex);
      if (priorityMatch) {
        priority = priorityMatch[1].trim();
        title = title.replace(priorityRegex, '').trim();
      }

      const item: Item = {
        ...ItemTemplate,
        id: generateInstanceId(),
        children: [],
        data: { title, checked, score, priority },
      };

      if (indent >= 2 && currentItem) {
        // Sub-item: nest under the most recent top-level item
        currentItem.children.push(item);
      } else {
        // Top-level item
        currentColumn.children.push(item);
        currentItem = item;
      }
      continue;
    }

    // Description lines (between swimlane header and first column header)
    if (currentSwimlane && !currentColumn) {
      descriptionLines.push(line);
    }
  }

  // Flush remaining
  flushDescription();
  if (currentColumn && currentSwimlane) {
    currentSwimlane.children.push(currentColumn);
  }
  if (currentSwimlane) {
    swimlanes.push(currentSwimlane);
  }

  const board: Board = {
    ...BoardTemplate,
    id: 'board',
    children: swimlanes,
    data: {
      settings,
      archive: [],
      errors,
      sprint,
    },
  };

  return board;
}

export function hasFrontmatterKeyRaw(data: string): boolean {
  if (!data) return false;
  const match = data.match(/---\s+([\w\W]+?)\s+---/);
  if (!match) return false;
  return match[1].contains ? match[1].contains(frontmatterKey) : match[1].includes(frontmatterKey);
}
