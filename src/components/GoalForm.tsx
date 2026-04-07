import { useContext, useState } from 'preact/compat';
import { SprintConfig } from '../types';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function twoWeeksISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function GoalForm() {
  const { boardModifiers, stateManager } = useContext(SwimlaneKanbanContext);
  const board = stateManager.useState();
  const [open, setOpen] = useState(false);

  const existing = board?.data?.sprint;

  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [startDate, setStartDate] = useState(existing?.startDate || todayISO());
  const [endDate, setEndDate] = useState(existing?.endDate || twoWeeksISO());

  const handleOpen = () => {
    // Sync with current sprint data when opening
    if (existing) {
      setName(existing.name || '');
      setDescription(existing.description || '');
      setStartDate(existing.startDate || todayISO());
      setEndDate(existing.endDate || twoWeeksISO());
    }
    setOpen(true);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return;

    const sprint: SprintConfig = {
      name: trimmedName,
      description: description.trim() || undefined,
      startDate,
      endDate,
    };
    boardModifiers.updateSprint(sprint);
    setOpen(false);
  };

  const handleRemove = () => {
    boardModifiers.updateSprint(undefined);
    setName('');
    setDescription('');
    setStartDate(todayISO());
    setEndDate(twoWeeksISO());
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        className={c('goal-btn')}
        onClick={handleOpen}
        title={existing ? 'Edit goal / sprint' : 'Set a goal or sprint for this board'}
        data-ignore-drag
      >
        {existing ? 'EDIT GOAL' : 'SET GOAL'}
      </button>
    );
  }

  return (
    <div className={c('goal-form')} onKeyDown={handleKeyDown}>
      <div className={c('goal-form-row')}>
        <label className={c('goal-form-label')}>Name</label>
        <input
          type="text"
          className={c('goal-form-input')}
          placeholder="Sprint name or goal..."
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          autoFocus
        />
      </div>
      <div className={c('goal-form-row')}>
        <label className={c('goal-form-label')}>Description</label>
        <input
          type="text"
          className={c('goal-form-input')}
          placeholder="Optional description..."
          value={description}
          onInput={(e) => setDescription((e.target as HTMLInputElement).value)}
        />
      </div>
      <div className={c('goal-form-row')}>
        <label className={c('goal-form-label')}>Start</label>
        <input
          type="date"
          className={c('goal-form-input') + ' ' + c('goal-form-date')}
          value={startDate}
          onInput={(e) => setStartDate((e.target as HTMLInputElement).value)}
        />
        <label className={c('goal-form-label')}>End</label>
        <input
          type="date"
          className={c('goal-form-input') + ' ' + c('goal-form-date')}
          value={endDate}
          onInput={(e) => setEndDate((e.target as HTMLInputElement).value)}
        />
      </div>
      <div className={c('goal-form-actions')}>
        <button className={c('goal-form-save')} onClick={handleSave}>
          Save
        </button>
        {existing && (
          <button className={c('goal-form-remove')} onClick={handleRemove}>
            Remove
          </button>
        )}
        <button className={c('goal-form-cancel')} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
