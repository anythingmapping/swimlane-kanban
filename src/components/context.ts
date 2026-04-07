import { createContext } from 'preact/compat';

import { SwimlaneKanbanView } from '../SwimlaneKanbanView';
import { StateManager } from '../StateManager';
import { BoardModifiers } from '../helpers/boardModifiers';

export interface SwimlaneKanbanContextProps {
  filePath?: string;
  stateManager: StateManager;
  boardModifiers: BoardModifiers;
  view: SwimlaneKanbanView;
}

export const SwimlaneKanbanContext = createContext<SwimlaneKanbanContextProps>(null);
