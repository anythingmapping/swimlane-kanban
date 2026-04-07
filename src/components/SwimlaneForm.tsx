import { useContext, useRef, useState } from 'preact/compat';

import { Item, SwimlaneTemplate, generateInstanceId } from '../types';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';

export function SwimlaneForm() {
  const { boardModifiers, stateManager } = useContext(SwimlaneKanbanContext);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const defaultColumns = stateManager.getSetting('default-columns') || [
      'To Do',
      'In Progress',
      'Done',
    ];
    const defaultWip = stateManager.getSetting('default-wip');

    const columns = defaultColumns.map((title) => ({
      id: generateInstanceId(),
      type: 'column' as const,
      accepts: ['item'],
      children: [] as Item[],
      data: { title, wipLimit: defaultWip },
    }));

    const swimlane = {
      ...SwimlaneTemplate,
      id: generateInstanceId(),
      children: columns,
      data: { title: trimmed },
    };

    boardModifiers.addSwimlane(swimlane);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={c('swimlane-form')}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Add a swimlane..."
        value={value}
        onInput={(e) => setValue((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        className={c('swimlane-form-input')}
      />
      <button onClick={handleSubmit} className={c('swimlane-form-btn')}>
        Add
      </button>
    </div>
  );
}
