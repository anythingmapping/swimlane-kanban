import { Board } from '../types';
import { c } from './helpers';

interface SprintHeaderProps {
  board: Board;
}

type SprintStatus = 'on-track' | 'behind' | 'at-risk' | 'complete' | 'ended';

function getStatus(taskPct: number, timePct: number, isEnded: boolean): SprintStatus {
  if (taskPct >= 1) return 'complete';
  if (isEnded) return 'ended';
  const delta = taskPct - timePct;
  if (delta >= -0.1) return 'on-track';
  if (delta > -0.25) return 'behind';
  return 'at-risk';
}

function countItems(board: Board): { total: number; checked: number } {
  let total = 0;
  let checked = 0;
  for (const swimlane of board.children) {
    for (const column of swimlane.children) {
      for (const item of column.children) {
        total++;
        if (item.data.checked) checked++;
        for (const sub of item.children) {
          total++;
          if (sub.data.checked) checked++;
        }
      }
    }
  }
  return { total, checked };
}

const STATUS_LABELS: Record<SprintStatus, string> = {
  'on-track': 'ON TRACK',
  'behind': 'BEHIND',
  'at-risk': 'AT RISK',
  'complete': 'COMPLETE',
  'ended': 'ENDED',
};

const STATUS_ICONS: Record<SprintStatus, string> = {
  'on-track': '\u2713',
  'behind': '\u26A0',
  'at-risk': '\u26A0',
  'complete': '\u2713',
  'ended': '\u2014',
};

function padBar(filled: number, total: number): string {
  const f = Math.round(filled * total);
  return '\u2588'.repeat(f) + '\u2591'.repeat(total - f);
}

export function SprintHeader({ board }: SprintHeaderProps) {
  const sprint = board.data.sprint;
  if (!sprint || !sprint.startDate || !sprint.endDate) return null;

  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const daysElapsed = Math.max(0, Math.min(totalDays, Math.round((now.getTime() - start.getTime()) / 86400000)));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const isEnded = now > end;

  const timePct = daysElapsed / totalDays;

  const { total, checked } = countItems(board);
  const taskPct = total > 0 ? checked / total : 0;
  const noTasks = total === 0;

  const status = getStatus(taskPct, timePct, isEnded);

  let rightLabel = '';
  if (status === 'complete') {
    const daysEarly = daysRemaining;
    rightLabel = daysEarly > 0 ? `COMPLETE \u2713 ${daysEarly} days early` : 'COMPLETE \u2713';
  } else if (status === 'ended') {
    rightLabel = `ENDED \u00B7 ${Math.round(taskPct * 100)}% complete`;
  } else {
    rightLabel = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
  }

  const BAR_WIDTH = 28;

  return (
    <div className={`${c('sprint-header')} ${c('sprint-header--' + status)}`}>
      <div className={c('sprint-header-top')}>
        <span className={c('sprint-header-name')}>
          GOAL: {sprint.name || 'Sprint'}
          {sprint.description && (
            <span className={c('sprint-header-desc')}> — {sprint.description}</span>
          )}
        </span>
        <span className={c('sprint-header-status')}>
          {STATUS_ICONS[status]} {rightLabel}{' '}
          <span className={c('sprint-header-badge')}>{STATUS_LABELS[status]}</span>
        </span>
      </div>

      {!noTasks && (
        <div className={c('sprint-row')}>
          <span className={c('sprint-row-label')}>Tasks</span>
          <div className={c('sprint-bar')}>
            <div
              className={`${c('sprint-bar-fill')} ${c('sprint-bar-fill--task')}`}
              style={{ width: `${Math.min(100, Math.round(taskPct * 100))}%` }}
            />
          </div>
          <span className={c('sprint-row-stat')}>
            {checked}/{total} done{'  '}({Math.round(taskPct * 100)}%)
          </span>
        </div>
      )}

      {noTasks && (
        <div className={c('sprint-row')}>
          <span className={c('sprint-row-label')}>Tasks</span>
          <span className={c('sprint-row-stat')}>No tasks</span>
        </div>
      )}

      <div className={c('sprint-row')}>
        <span className={c('sprint-row-label')}>Time</span>
        <div className={c('sprint-bar')}>
          <div
            className={`${c('sprint-bar-fill')} ${c('sprint-bar-fill--time')}`}
            style={{ width: `${Math.min(100, Math.round(timePct * 100))}%` }}
          />
        </div>
        <span className={c('sprint-row-stat')}>
          {daysElapsed}/{totalDays} days{'  '}({Math.round(timePct * 100)}%)
        </span>
      </div>
    </div>
  );
}
