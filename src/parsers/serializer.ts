import { Board } from '../types';
import { frontmatterKey } from './markdown';

export function serializeBoard(board: Board): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`${frontmatterKey}: board`);
  if (board.data.sprint) {
    const s = board.data.sprint;
    if (s.name) lines.push(`sprint-name: ${s.name}`);
    if (s.description) lines.push(`sprint-description: ${s.description}`);
    if (s.startDate) lines.push(`sprint-start: ${s.startDate}`);
    if (s.endDate) lines.push(`sprint-end: ${s.endDate}`);
  }
  lines.push('---');
  lines.push('');

  for (const swimlane of board.children) {
    const colorTag = swimlane.data.color ? ` [color:${swimlane.data.color}]` : '';
    lines.push(`# Swimlane: ${swimlane.data.title}${colorTag}`);

    if (swimlane.data.scaffold && swimlane.data.scaffold.length > 0) {
      lines.push('');
      lines.push('<!-- scaffold');
      for (const task of swimlane.data.scaffold) {
        lines.push(task);
      }
      lines.push('-->');
    }

    if (swimlane.data.description) {
      lines.push('');
      lines.push(swimlane.data.description);
    }

    for (const column of swimlane.children) {
      const wipStr = column.data.wipLimit ? ` [wip:${column.data.wipLimit}]` : '';
      const widthStr = column.data.width ? ` [width:${column.data.width}]` : '';
      lines.push(`## ${column.data.title}${wipStr}${widthStr}`);

      const serializeItem = (item: any, indent: string) => {
        const check = item.data.checked ? 'x' : ' ';
        const scoreStr = item.data.score !== undefined ? ` [score::${item.data.score}]` : '';
        lines.push(`${indent}- [${check}] ${item.data.title}${scoreStr}`);
        for (const child of item.children) {
          serializeItem(child, indent + '  ');
        }
      };

      for (const item of column.children) {
        serializeItem(item, '');
      }
    }

    lines.push('');
  }

  // Settings block
  const settingsStr = JSON.stringify(board.data.settings);
  if (settingsStr !== '{}') {
    lines.push('%% swimlane-kanban:settings');
    lines.push('```');
    lines.push(settingsStr);
    lines.push('```');
    lines.push('%%');
  }

  return lines.join('\n');
}
