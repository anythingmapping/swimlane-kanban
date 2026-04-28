import { BoardTemplate, ColumnTemplate, ItemTemplate, SwimlaneTemplate, generateInstanceId, } from '../types';
export const frontmatterKey = 'swimlane-kanban';
export const basicFrontmatter = ['---', '', `${frontmatterKey}: board`, '', '---', '', ''].join('\n');
const swimlaneRegex = /^#\s+Swimlane:\s*(.+?)(?:\s+\[color:(\w+)\])?\s*$/;
const columnRegex = /^##\s+(.+?)(?:\s+\[wip:(\d+)\])?(?:\s+\[width:(\d+)\])?\s*$/;
const itemRegex = /^(\s*)-\s+\[([ xX])\]\s+(.+)$/;
const scoreRegex = /\s*\[score::(\d+)\]/;
const priorityRegex = /\s*\[priority::([^\]]+)\]/;
const settingsStartRegex = /^%%\s*swimlane-kanban:settings\s*$/;
const settingsEndRegex = /^%%\s*$/;
const codeBlockRegex = /^```\s*$/;
export function parseMarkdown(md) {
    const lines = md.split('\n');
    const swimlanes = [];
    let settings = {};
    const errors = [];
    let sprint;
    let currentSwimlane = null;
    let currentColumn = null;
    let currentItem = null;
    let inSettings = false;
    let inCodeBlock = false;
    let inScaffold = false;
    let settingsJson = '';
    let descriptionLines = [];
    let scaffoldLines = [];
    const flushDescription = () => {
        if (currentSwimlane && descriptionLines.length > 0) {
            const desc = descriptionLines.join('\n').trim();
            if (desc)
                currentSwimlane.data.description = desc;
        }
        descriptionLines = [];
    };
    // Parse frontmatter for sprint config
    {
        let inFm = false;
        for (const line of lines) {
            if (line.trim() === '---') {
                if (inFm)
                    break;
                inFm = true;
                continue;
            }
            if (!inFm)
                continue;
            const sprintNameMatch = line.match(/^sprint-name:\s*(.+)$/);
            const sprintDescMatch = line.match(/^sprint-description:\s*(.+)$/);
            const sprintStartMatch = line.match(/^sprint-start:\s*(.+)$/);
            const sprintEndMatch = line.match(/^sprint-end:\s*(.+)$/);
            if (sprintNameMatch || sprintDescMatch || sprintStartMatch || sprintEndMatch) {
                if (!sprint)
                    sprint = {};
                if (sprintNameMatch)
                    sprint.name = sprintNameMatch[1].trim();
                if (sprintDescMatch)
                    sprint.description = sprintDescMatch[1].trim();
                if (sprintStartMatch)
                    sprint.startDate = sprintStartMatch[1].trim();
                if (sprintEndMatch)
                    sprint.endDate = sprintEndMatch[1].trim();
            }
        }
        // Validate: need both start and end, and end >= start
        if (sprint && sprint.startDate && sprint.endDate) {
            const s = new Date(sprint.startDate);
            const e = new Date(sprint.endDate);
            if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
                sprint = undefined;
            }
        }
        else if (sprint) {
            sprint = undefined;
        }
    }
    for (const line of lines) {
        // Skip frontmatter
        if (line.startsWith('---'))
            continue;
        if (line.startsWith(`${frontmatterKey}:`))
            continue;
        if (/^sprint-(name|description|start|end):/.test(line))
            continue;
        // Settings block detection
        if (settingsStartRegex.test(line)) {
            inSettings = true;
            continue;
        }
        if (inSettings) {
            if (codeBlockRegex.test(line)) {
                if (inCodeBlock) {
                    inCodeBlock = false;
                }
                else {
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
                }
                catch (e) {
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
                    if (tasks.length > 0)
                        currentSwimlane.data.scaffold = tasks;
                }
                scaffoldLines = [];
            }
            else {
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
            let score;
            const scoreMatch = title.match(scoreRegex);
            if (scoreMatch) {
                const val = parseInt(scoreMatch[1], 10);
                if (val >= 0 && val <= 10)
                    score = val;
                title = title.replace(scoreRegex, '').trim();
            }
            let priority;
            const priorityMatch = title.match(priorityRegex);
            if (priorityMatch) {
                priority = priorityMatch[1].trim();
                title = title.replace(priorityRegex, '').trim();
            }
            const item = {
                ...ItemTemplate,
                id: generateInstanceId(),
                children: [],
                data: { title, checked, score, priority },
            };
            if (indent >= 2 && currentItem) {
                // Sub-item: nest under the most recent top-level item
                currentItem.children.push(item);
            }
            else {
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
    const board = {
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
export function hasFrontmatterKeyRaw(data) {
    if (!data)
        return false;
    const match = data.match(/---\s+([\w\W]+?)\s+---/);
    if (!match)
        return false;
    return match[1].contains ? match[1].contains(frontmatterKey) : match[1].includes(frontmatterKey);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYXJrZG93bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBR0wsYUFBYSxFQUViLGNBQWMsRUFLZCxZQUFZLEVBRVosZ0JBQWdCLEVBQ2hCLGtCQUFrQixHQUNuQixNQUFNLFVBQVUsQ0FBQztBQUVsQixNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUM7QUFFaEQsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsY0FBYyxTQUFTLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUM3RixJQUFJLENBQ0wsQ0FBQztBQUVGLE1BQU0sYUFBYSxHQUFHLG1EQUFtRCxDQUFDO0FBQzFFLE1BQU0sV0FBVyxHQUFHLDZEQUE2RCxDQUFDO0FBQ2xGLE1BQU0sU0FBUyxHQUFHLCtCQUErQixDQUFDO0FBQ2xELE1BQU0sVUFBVSxHQUFHLHFCQUFxQixDQUFDO0FBQ3pDLE1BQU0sYUFBYSxHQUFHLDJCQUEyQixDQUFDO0FBQ2xELE1BQU0sa0JBQWtCLEdBQUcsb0NBQW9DLENBQUM7QUFDaEUsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7QUFDbkMsTUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDO0FBRWxDLE1BQU0sVUFBVSxhQUFhLENBQUMsRUFBVTtJQUN0QyxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTdCLE1BQU0sU0FBUyxHQUFlLEVBQUUsQ0FBQztJQUNqQyxJQUFJLFFBQVEsR0FBMkIsRUFBRSxDQUFDO0lBQzFDLE1BQU0sTUFBTSxHQUE2QyxFQUFFLENBQUM7SUFDNUQsSUFBSSxNQUFnQyxDQUFDO0lBRXJDLElBQUksZUFBZSxHQUFvQixJQUFJLENBQUM7SUFDNUMsSUFBSSxhQUFhLEdBQWtCLElB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QUFJLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFVO1FBQ25CLEdBQUcsYUFBYTtRQUNoQixFQUFFLEVBQUUsT0FBTztRQUNYLFFBQVEsRUFBRSxTQUFTO1FBQ25CLElBQUksRUFBRTtZQUNKLFFBQVE7WUFDUixPQUFPLEVBQUUsRUFBRTtZQUNYLE1BQU07WUFDTixNQUFNO1NBQ1A7S0FDRixDQUFDO0lBRUYsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLElBQVk7SUFDL0MsSUFBSSxDQUFDLElBQUk7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUN4QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDbkQsSUFBSSxDQUFDLEtBQUs7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUN6QixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDbkcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEJvYXJkLFxuICBCb2FyZERhdGEsXG4gIEJvYXJkVGVtcGxhdGUsXG4gIENvbHVtbixcbiAgQ29sdW1uVGVtcGxhdGUsXG4gIERhdGFUeXBlcyxcbiAgU3ByaW50Q29uZmlnLFxuICBTd2ltbGFuZUthbmJhblNldHRpbmdzLFxuICBJdGVtLFxuICBJdGVtVGVtcGxhdGUsXG4gIFN3aW1sYW5lLFxuICBTd2ltbGFuZVRlbXBsYXRlLFxuICBnZW5lcmF0ZUluc3RhbmNlSWQsXG59IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNvbnN0IGZyb250bWF0dGVyS2V5ID0gJ3N3aW1sYW5lLWthbmJhbic7XG5cbmV4cG9ydCBjb25zdCBiYXNpY0Zyb250bWF0dGVyID0gWyctLS0nLCAnJywgYCR7ZnJvbnRtYXR0ZXJLZXl9OiBib2FyZGAsICcnLCAnLS0tJywgJycsICcnXS5qb2luKFxuICAnXFxuJ1xuKTtcblxuY29uc3Qgc3dpbWxhbmVSZWdleCA9IC9eI1xccytTd2ltbGFuZTpcXHMqKC4rPykoPzpcXHMrXFxbY29sb3I6KFxcdyspXFxdKT9cXHMqJC87XG5jb25zdCBjb2x1bW5SZWdleCA9IC9eIyNcXHMrKC4rPykoPzpcXHMrXFxbd2lwOihcXGQrKVxcXSk/KD86XFxzK1xcW3dpZHRoOihcXGQrKVxcXSk/XFxzKiQvO1xuY29uc3QgaXRlbVJlZ2V4ID0gL14oXFxzKiktXFxzK1xcWyhbIHhYXSlcXF1cXHMrKC4rKSQvO1xuY29uc3Qgc2NvcmVSZWdleCA9IC9cXHMqXFxbc2NvcmU6OihcXGQrKVxcXS87XG5jb25zdCBwcmlvcml0eVJlZ2V4ID0gL1xccypcXFtwcmlvcml0eTo6KFteXFxdXSspXFxdLztcbmNvbnN0IHNldHRpbmdzU3RhcnRSZWdleCA9IC9eJSVcXHMqc3dpbWxhbmUta2FuYmFuOnNldHRpbmdzXFxzKiQvO1xuY29uc3Qgc2V0dGluZ3NFbmRSZWdleCA9IC9eJSVcXHMqJC87XG5jb25zdCBjb2RlQmxvY2tSZWdleCA9IC9eYGBgXFxzKiQvO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNYXJrZG93bihtZDogc3RyaW5nKTogQm9hcmQge1xuICBjb25zdCBsaW5lcyA9IG1kLnNwbGl0KCdcXG4nKTtcblxuICBjb25zdCBzd2ltbGFuZXM6IFN3aW1sYW5lW10gPSBbXTtcbiAgbGV0IHNldHRpbmdzOiBTd2ltbGFuZUthbmJhblNldHRpbmdzID0ge307XG4gIGNvbnN0IGVycm9yczogeyBkZXNjcmlwdGlvbjogc3RyaW5nOyBzdGFjazogc3RyaW5nIH1bXSA9IFtdO1xuICBsZXQgc3ByaW50OiBTcHJpbnRDb25maWcgfCB1bmRlZmluZWQ7XG5cbiAgbGV0IGN1cnJlbnRTd2ltbGFuZTogU3dpbWxhbmUgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRDb2x1bW46IENvbHVtbiB8IG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudEl0ZW06IEl0ZW0gfCBudWxsID0gbnVsbDtcbiAgbGV0IGluU2V0dGluZ3MgPSBmYWxzZTtcbiAgbGV0IGluQ29kZUJsb2NrID0gZmFsc2U7XG4gIGxldCBpblNjYWZmb2xkID0gZmFsc2U7XG4gIGxldCBzZXR0aW5nc0pzb24gPSAnJztcbiAgbGV0IGRlc2NyaXB0aW9uTGluZXM6IHN0cmluZ1tdID0gW107XG4gIGxldCBzY2FmZm9sZExpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGNvbnN0IGZsdXNoRGVzY3JpcHRpb24gPSAoKSA9PiB7XG4gICAgaWYgKGN1cnJlbnRTd2ltbGFuZSAmJiBkZXNjcmlwdGlvbkxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGRlc2MgPSBkZXNjcmlwdGlvbkxpbmVzLmpvaW4oJ1xcbicpLnRyaW0oKTtcbiAgICAgIGlmIChkZXNjKSBjdXJyZW50U3dpbWxhbmUuZGF0YS5kZXNjcmlwdGlvbiA9IGRlc2M7XG4gICAgfVxuICAgIGRlc2NyaXB0aW9uTGluZXMgPSBbXTtcbiAgfTtcblxuICAvLyBQYXJzZSBmcm9udG1hdHRlciBmb3Igc3ByaW50IGNvbmZpZ1xuICB7XG4gICAgbGV0IGluRm0gPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSA9PT0gJy0tLScpIHtcbiAgICAgICAgaWYgKGluRm0pIGJyZWFrO1xuICAgICAgICBpbkZtID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIWluRm0pIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgc3ByaW50TmFtZU1hdGNoID0gbGluZS5tYXRjaCgvXnNwcmludC1uYW1lOlxccyooLispJC8pO1xuICAgICAgY29uc3Qgc3ByaW50RGVzY01hdGNoID0gbGluZS5tYXRjaCgvXnNwcmludC1kZXNjcmlwdGlvbjpcXHMqKC4rKSQvKTtcbiAgICAgIGNvbnN0IHNwcmludFN0YXJ0TWF0Y2ggPSBsaW5lLm1hdGNoKC9ec3ByaW50LXN0YXJ0OlxccyooLispJC8pO1xuICAgICAgY29uc3Qgc3ByaW50RW5kTWF0Y2ggPSBsaW5lLm1hdGNoKC9ec3ByaW50LWVuZDpcXHMqKC4rKSQvKTtcbiAgICAgIGlmIChzcHJpbnROYW1lTWF0Y2ggfHwgc3ByaW50RGVzY01hdGNoIHx8IHNwcmludFN0YXJ0TWF0Y2ggfHwgc3ByaW50RW5kTWF0Y2gpIHtcbiAgICAgICAgaWYgKCFzcHJpbnQpIHNwcmludCA9IHt9O1xuICAgICAgICBpZiAoc3ByaW50TmFtZU1hdGNoKSBzcHJpbnQubmFtZSA9IHNwcmludE5hbWVNYXRjaFsxXS50cmltKCk7XG4gICAgICAgIGlmIChzcHJpbnREZXNjTWF0Y2gpIHNwcmludC5kZXNjcmlwdGlvbiA9IHNwcmludERlc2NNYXRjaFsxXS50cmltKCk7XG4gICAgICAgIGlmIChzcHJpbnRTdGFydE1hdGNoKSBzcHJpbnQuc3RhcnREYXRlID0gc3ByaW50U3RhcnRNYXRjaFsxXS50cmltKCk7XG4gICAgICAgIGlmIChzcHJpbnRFbmRNYXRjaCkgc3ByaW50LmVuZERhdGUgPSBzcHJpbnRFbmRNYXRjaFsxXS50cmltKCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFZhbGlkYXRlOiBuZWVkIGJvdGggc3RhcnQgYW5kIGVuZCwgYW5kIGVuZCA+PSBzdGFydFxuICAgIGlmIChzcHJpbnQgJiYgc3ByaW50LnN0YXJ0RGF0ZSAmJiBzcHJpbnQuZW5kRGF0ZSkge1xuICAgICAgY29uc3QgcyA9IG5ldyBEYXRlKHNwcmludC5zdGFydERhdGUpO1xuICAgICAgY29uc3QgZSA9IG5ldyBEYXRlKHNwcmludC5lbmREYXRlKTtcbiAgICAgIGlmIChpc05hTihzLmdldFRpbWUoKSkgfHwgaXNOYU4oZS5nZXRUaW1lKCkpIHx8IGUgPCBzKSB7XG4gICAgICAgIHNwcmludCA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNwcmludCkge1xuICAgICAgc3ByaW50ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIC8vIFNraXAgZnJvbnRtYXR0ZXJcbiAgICBpZiAobGluZS5zdGFydHNXaXRoKCctLS0nKSkgY29udGludWU7XG4gICAgaWYgKGxpbmUuc3RhcnRzV2l0aChgJHtmcm9udG1hdHRlcktleX06YCkpIGNvbnRpbnVlO1xuICAgIGlmICgvXnNwcmludC0obmFtZXxkZXNjcmlwdGlvbnxzdGFydHxlbmQpOi8udGVzdChsaW5lKSkgY29udGludWU7XG5cbiAgICAvLyBTZXR0aW5ncyBibG9jayBkZXRlY3Rpb25cbiAgICBpZiAoc2V0dGluZ3NTdGFydFJlZ2V4LnRlc3QobGluZSkpIHtcbiAgICAgIGluU2V0dGluZ3MgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGluU2V0dGluZ3MpIHtcbiAgICAgIGlmIChjb2RlQmxvY2tSZWdleC50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGlmIChpbkNvZGVCbG9jaykge1xuICAgICAgICAgIGluQ29kZUJsb2NrID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5Db2RlQmxvY2sgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0dGluZ3NFbmRSZWdleC50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGluU2V0dGluZ3MgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoc2V0dGluZ3NKc29uLnRyaW0oKSkge1xuICAgICAgICAgICAgc2V0dGluZ3MgPSBKU09OLnBhcnNlKHNldHRpbmdzSnNvbi50cmltKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKHsgZGVzY3JpcHRpb246IGBGYWlsZWQgdG8gcGFyc2Ugc2V0dGluZ3M6ICR7ZX1gLCBzdGFjazogJycgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHNldHRpbmdzSnNvbiArPSBsaW5lO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2NhZmZvbGQgYmxvY2tcbiAgICBpZiAoaW5TY2FmZm9sZCkge1xuICAgICAgaWYgKGxpbmUudHJpbSgpID09PSAnLS0+Jykge1xuICAgICAgICBpblNjYWZmb2xkID0gZmFsc2U7XG4gICAgICAgIGlmIChjdXJyZW50U3dpbWxhbmUpIHtcbiAgICAgICAgICBjb25zdCB0YXNrcyA9IHNjYWZmb2xkTGluZXMubWFwKGwgPT4gbC50cmltKCkpLmZpbHRlcihsID0+IGwubGVuZ3RoID4gMCk7XG4gICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCA+IDApIGN1cnJlbnRTd2ltbGFuZS5kYXRhLnNjYWZmb2xkID0gdGFza3M7XG4gICAgICAgIH1cbiAgICAgICAgc2NhZmZvbGRMaW5lcyA9IFtdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NhZmZvbGRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChsaW5lLnRyaW0oKSA9PT0gJzwhLS0gc2NhZmZvbGQnKSB7XG4gICAgICBpblNjYWZmb2xkID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFN3aW1sYW5lIGhlYWRlclxuICAgIGNvbnN0IHN3aW1sYW5lTWF0Y2ggPSBsaW5lLm1hdGNoKHN3aW1sYW5lUmVnZXgpO1xuICAgIGlmIChzd2ltbGFuZU1hdGNoKSB7XG4gICAgICBmbHVzaERlc2NyaXB0aW9uKCk7XG4gICAgICBjdXJyZW50SXRlbSA9IG51bGw7XG4gICAgICBpZiAoY3VycmVudENvbHVtbiAmJiBjdXJyZW50U3dpbWxhbmUpIHtcbiAgICAgICAgY3VycmVudFN3aW1sYW5lLmNoaWxkcmVuLnB1c2goY3VycmVudENvbHVtbik7XG4gICAgICB9XG4gICAgICBpZiAoY3VycmVudFN3aW1sYW5lKSB7XG4gICAgICAgIHN3aW1sYW5lcy5wdXNoKGN1cnJlbnRTd2ltbGFuZSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50Q29sdW1uID0gbnVsbDtcbiAgICAgIGN1cnJlbnRTd2ltbGFuZSA9IHtcbiAgICAgICAgLi4uU3dpbWxhbmVUZW1wbGF0ZSxcbiAgICAgICAgaWQ6IGdlbmVyYXRlSW5zdGFuY2VJZCgpLFxuICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgIGRhdGE6IHsgdGl0bGU6IHN3aW1sYW5lTWF0Y2hbMV0udHJpbSgpLCBjb2xvcjogc3dpbWxhbmVNYXRjaFsyXSB8fCB1bmRlZmluZWQgfSxcbiAgICAgIH07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBDb2x1bW4gaGVhZGVyXG4gICAgY29uc3QgY29sdW1uTWF0Y2ggPSBsaW5lLm1hdGNoKGNvbHVtblJlZ2V4KTtcbiAgICBpZiAoY29sdW1uTWF0Y2gpIHtcbiAgICAgIGZsdXNoRGVzY3JpcHRpb24oKTtcbiAgICAgIGN1cnJlbnRJdGVtID0gbnVsbDtcbiAgICAgIGlmIChjdXJyZW50Q29sdW1uICYmIGN1cnJlbnRTd2ltbGFuZSkge1xuICAgICAgICBjdXJyZW50U3dpbWxhbmUuY2hpbGRyZW4ucHVzaChjdXJyZW50Q29sdW1uKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHdpcExpbWl0ID0gY29sdW1uTWF0Y2hbMl0gPyBwYXJzZUludChjb2x1bW5NYXRjaFsyXSwgMTApIDogdW5kZWZpbmVkO1xuICAgICAgY29uc3Qgd2lkdGggPSBjb2x1bW5NYXRjaFszXSA/IHBhcnNlSW50KGNvbHVtbk1hdGNoWzNdLCAxMCkgOiB1bmRlZmluZWQ7XG4gICAgICBjdXJyZW50Q29sdW1uID0ge1xuICAgICAgICAuLi5Db2x1bW5UZW1wbGF0ZSxcbiAgICAgICAgaWQ6IGdlbmVyYXRlSW5zdGFuY2VJZCgpLFxuICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgIGRhdGE6IHsgdGl0bGU6IGNvbHVtbk1hdGNoWzFdLnRyaW0oKSwgd2lwTGltaXQsIHdpZHRoIH0sXG4gICAgICB9O1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gSXRlbSAod2l0aCBvcHRpb25hbCBsZWFkaW5nIHdoaXRlc3BhY2UgZm9yIHN1Yi1pdGVtcylcbiAgICBjb25zdCBpdGVtTWF0Y2ggPSBsaW5lLm1hdGNoKGl0ZW1SZWdleCk7XG4gICAgaWYgKGl0ZW1NYXRjaCAmJiBjdXJyZW50Q29sdW1uKSB7XG4gICAgICBjb25zdCBpbmRlbnQgPSBpdGVtTWF0Y2hbMV0ubGVuZ3RoO1xuICAgICAgY29uc3QgY2hlY2tlZCA9IGl0ZW1NYXRjaFsyXSAhPT0gJyAnO1xuICAgICAgbGV0IHRpdGxlID0gaXRlbU1hdGNoWzNdO1xuICAgICAgbGV0IHNjb3JlOiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbiAgICAgIGNvbnN0IHNjb3JlTWF0Y2ggPSB0aXRsZS5tYXRjaChzY29yZVJlZ2V4KTtcbiAgICAgIGlmIChzY29yZU1hdGNoKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHNjb3JlTWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgaWYgKHZhbCA+PSAwICYmIHZhbCA8PSAxMCkgc2NvcmUgPSB2YWw7XG4gICAgICAgIHRpdGxlID0gdGl0bGUucmVwbGFjZShzY29yZVJlZ2V4LCAnJykudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICBsZXQgcHJpb3JpdHk6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHByaW9yaXR5TWF0Y2ggPSB0aXRsZS5tYXRjaChwcmlvcml0eVJlZ2V4KTtcbiAgICAgIGlmIChwcmlvcml0eU1hdGNoKSB7XG4gICAgICAgIHByaW9yaXR5ID0gcHJpb3JpdHlNYXRjaFsxXS50cmltKCk7XG4gICAgICAgIHRpdGxlID0gdGl0bGUucmVwbGFjZShwcmlvcml0eVJlZ2V4LCAnJykudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpdGVtOiBJdGVtID0ge1xuICAgICAgICAuLi5JdGVtVGVtcGxhdGUsXG4gICAgICAgIGlkOiBnZW5lcmF0ZUluc3RhbmNlSWQoKSxcbiAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICBkYXRhOiB7IHRpdGxlLCBjaGVja2VkLCBzY29yZSwgcHJpb3JpdHkgfSxcbiAgICAgIH07XG5cbiAgICAgIGlmIChpbmRlbnQgPj0gMiAmJiBjdXJyZW50SXRlbSkge1xuICAgICAgICAvLyBTdWItaXRlbTogbmVzdCB1bmRlciB0aGUgbW9zdCByZWNlbnQgdG9wLWxldmVsIGl0ZW1cbiAgICAgICAgY3VycmVudEl0ZW0uY2hpbGRyZW4ucHVzaChpdGVtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRvcC1sZXZlbCBpdGVtXG4gICAgICAgIGN1cnJlbnRDb2x1bW4uY2hpbGRyZW4ucHVzaChpdGVtKTtcbiAgICAgICAgY3VycmVudEl0ZW0gPSBpdGVtO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gRGVzY3JpcHRpb24gbGluZXMgKGJldHdlZW4gc3dpbWxhbmUgaGVhZGVyIGFuZCBmaXJzdCBjb2x1bW4gaGVhZGVyKVxuICAgIGlmIChjdXJyZW50U3dpbWxhbmUgJiYgIWN1cnJlbnRDb2x1bW4pIHtcbiAgICAgIGRlc2NyaXB0aW9uTGluZXMucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICAvLyBGbHVzaCByZW1haW5pbmdcbiAgZmx1c2hEZXNjcmlwdGlvbigpO1xuICBpZiAoY3VycmVudENvbHVtbiAmJiBjdXJyZW50U3dpbWxhbmUpIHtcbiAgICBjdXJyZW50U3dpbWxhbmUuY2hpbGRyZW4ucHVzaChjdXJyZW50Q29sdW1uKTtcbiAgfVxuICBpZiAoY3VycmVudFN3aW1sYW5lKSB7XG4gICAgc3dpbWxhbmVzLnB1c2goY3VycmVudFN3aW1sYW5lKTtcbiAgfVxuXG4gIGNvbnN0IGJvYXJkOiBCb2FyZCA9IHtcbiAgICAuLi5Cb2FyZFRlbXBsYXRlLFxuICAgIGlkOiAnYm9hcmQnLFxuICAgIGNoaWxkcmVuOiBzd2ltbGFuZXMsXG4gICAgZGF0YToge1xuICAgICAgc2V0dGluZ3MsXG4gICAgICBhcmNoaXZlOiBbXSxcbiAgICAgIGVycm9ycyxcbiAgICAgIHNwcmludCxcbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBib2FyZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0Zyb250bWF0dGVyS2V5UmF3KGRhdGE6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWRhdGEpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgbWF0Y2ggPSBkYXRhLm1hdGNoKC8tLS1cXHMrKFtcXHdcXFddKz8pXFxzKy0tLS8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBtYXRjaFsxXS5jb250YWlucyA/IG1hdGNoWzFdLmNvbnRhaW5zKGZyb250bWF0dGVyS2V5KSA6IG1hdGNoWzFdLmluY2x1ZGVzKGZyb250bWF0dGVyS2V5KTtcbn1cbiJdfQ==