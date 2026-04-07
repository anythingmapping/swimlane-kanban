import { useContext, useRef, useState } from 'preact/compat';

import { updateEntity } from '../dnd/util/data';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';
import { WikiLinkDropdown, useWikiLinkSuggest } from './WikiLinkSuggest';

interface CardFormProps {
  columnPath: number[];
}

export function CardForm({ columnPath }: CardFormProps) {
  const { stateManager } = useContext(SwimlaneKanbanContext);
  const [value, setValue] = useState('');
  const [score, setScore] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggest, anchor, accept, handleKeyDown: suggestKeyDown } = useWikiLinkSuggest(
    stateManager.app,
    value,
    setValue,
    inputRef
  );

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const parsedScore = score !== '' ? Math.min(10, Math.max(0, parseInt(score, 10))) : undefined;
    const newItem = stateManager.getNewItem(trimmed, false, Number.isNaN(parsedScore) ? undefined : parsedScore);
    stateManager.setState((board) => updateEntity(board, columnPath, { children: { $push: [newItem] } }));
    setValue('');
    setScore('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (suggestKeyDown(e)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={c('card-form')}>
      <div className={c('card-form-row')}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a card..."
          value={value}
          onInput={(e) => setValue((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          className={c('card-form-input')}
        />
        <input
          type="number"
          min="0"
          max="10"
          placeholder="0-10"
          value={score}
          onInput={(e) => setScore((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          className={c('card-form-score')}
        />
      </div>
      {suggest && anchor && (
        <WikiLinkDropdown suggest={suggest} anchor={anchor} accept={accept} close={() => {}} />
      )}
    </div>
  );
}
