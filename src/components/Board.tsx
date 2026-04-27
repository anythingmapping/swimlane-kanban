import { StateManager } from '../StateManager';
import { SwimlaneKanbanView } from '../SwimlaneKanbanView';
import { DndScope } from '../dnd/components/Scope';
import { getBoardModifiers } from '../helpers/boardModifiers';
import { sendToDailyNote } from '../helpers/dailyNote';
import { THEMES, DEFAULT_THEME, ThemeId } from '../themes';
import { GoalForm } from './GoalForm';
import { SprintHeader } from './SprintHeader';
import { Swimlane } from './Swimlane';
import { SwimlaneForm } from './SwimlaneForm';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';

interface BoardProps {
  stateManager: StateManager;
  view: SwimlaneKanbanView;
}

export function Board({ stateManager, view }: BoardProps) {
  const board = stateManager.useState();
  const boardModifiers = getBoardModifiers(view, stateManager);

  if (!board) return null;

  if (board.data.errors.length > 0) {
    return (
      <div className={c('error')}>
        <h3>Error loading board</h3>
        {board.data.errors.map((err, i) => (
          <pre key={i}>{err.description}</pre>
        ))}
      </div>
    );
  }

  const columnWidth = stateManager.getSetting('column-width') || 272;
  const themeId = (stateManager.getSetting('theme') || DEFAULT_THEME) as ThemeId;
  const themeTokens = THEMES[themeId]?.tokens || {};

  const handleSendToDaily = () => {
    const titles: string[] = [];
    for (const swimlane of board.children) {
      for (const column of swimlane.children) {
        if (column.data.title.toLowerCase().trim() === 'in progress') {
          for (const item of column.children) {
            titles.push(item.data.title);
          }
        }
      }
    }
    sendToDailyNote(stateManager.app, titles, view.file?.path);
  };

  return (
    <SwimlaneKanbanContext.Provider
      value={{ stateManager, boardModifiers, view, filePath: view.file?.path }}
    >
      <DndScope id={view.id}>
        <div
          className={c('board') + ` swimlane-kanban--theme-${themeId}`}
          style={{ '--column-width': `${columnWidth}px`, ...themeTokens } as any}
        >
          <div className={c('toolbar')}>
            <GoalForm />
            <button className={c('daily-note-btn')} onClick={handleSendToDaily} title="Send all in-progress cards to today's daily note under ## KANBAN" data-ignore-drag>
              DAILY NOTE
            </button>
          </div>
          <SprintHeader board={board} />
          {board.children.map((swimlane, i) => (
            <Swimlane key={swimlane.id} swimlane={swimlane} swimlaneIndex={i} />
          ))}
          <SwimlaneForm />
        </div>
      </DndScope>
    </SwimlaneKanbanContext.Provider>
  );
}
