import update from 'immutability-helper';
import { App, TFile } from 'obsidian';
import { useEffect, useState } from 'preact/compat';

import { SwimlaneKanbanView } from './SwimlaneKanbanView';
import { parseMarkdown } from './parsers/markdown';
import { serializeBoard } from './parsers/serializer';
import { Board, SwimlaneKanbanSettings, Item, generateInstanceId } from './types';

export class StateManager {
  onEmpty: () => void;
  getGlobalSettings: () => SwimlaneKanbanSettings;

  stateReceivers: Array<(state: Board) => void> = [];
  viewSet: Set<SwimlaneKanbanView> = new Set();

  app: App;
  state: Board;
  file: TFile;

  constructor(
    app: App,
    initialView: SwimlaneKanbanView,
    initialData: string,
    onEmpty: () => void,
    getGlobalSettings: () => SwimlaneKanbanSettings
  ) {
    this.app = app;
    this.file = initialView.file;
    this.onEmpty = onEmpty;
    this.getGlobalSettings = getGlobalSettings;

    this.registerView(initialView, initialData, true);
  }

  getAView(): SwimlaneKanbanView {
    return this.viewSet.values().next().value;
  }

  registerView(view: SwimlaneKanbanView, data: string, shouldParseData: boolean) {
    if (!this.viewSet.has(view)) {
      this.viewSet.add(view);
    }

    if (shouldParseData) {
      this.newBoard(data);
    }
  }

  unregisterView(view: SwimlaneKanbanView) {
    if (this.viewSet.has(view)) {
      this.viewSet.delete(view);
      if (this.viewSet.size === 0) {
        this.onEmpty();
      }
    }
  }

  newBoard(md: string) {
    try {
      const board = parseMarkdown(md);
      this.setState(board, false);
    } catch (e) {
      this.setError(e);
    }
  }

  saveToDisk() {
    if (this.state.data.errors.length > 0) return;

    const view = this.getAView();
    if (view) {
      const fileStr = serializeBoard(this.state);
      view.requestSaveToDisk(fileStr);
      this.viewSet.forEach((v) => {
        v.data = fileStr;
      });
    }
  }

  softRefresh() {
    this.stateReceivers.forEach((receiver) => receiver({ ...this.state }));
  }

  forceRefresh() {
    if (this.state) {
      this.stateReceivers.forEach((receiver) => receiver(this.state));
    }
  }

  setState(state: Board | ((board: Board) => Board), shouldSave: boolean = true) {
    try {
      const newState = typeof state === 'function' ? state(this.state) : state;
      this.state = newState;

      if (shouldSave) {
        this.saveToDisk();
      }

      this.stateReceivers.forEach((receiver) => receiver(this.state));
    } catch (e) {
      console.error(e);
      this.setError(e);
    }
  }

  useState(): Board {
    const [state, setState] = useState(this.state);

    useEffect(() => {
      this.stateReceivers.push((state) => setState(state));
      setState(this.state);
      return () => {
        this.stateReceivers.remove(setState);
      };
    }, []);

    return state;
  }

  setError(e: Error) {
    this.setState(
      update(this.state, {
        data: {
          errors: {
            $push: [{ description: e.toString(), stack: e.stack || '' }],
          },
        },
      }),
      false
    );
  }

  getSetting<K extends keyof SwimlaneKanbanSettings>(key: K): SwimlaneKanbanSettings[K] {
    return this.state?.data?.settings?.[key] ?? this.getGlobalSettings()?.[key];
  }

  getNewItem(title: string, checked: boolean = false, score?: number): Item {
    return {
      id: generateInstanceId(),
      type: 'item',
      accepts: ['item'],
      children: [],
      data: { title, checked, score },
    };
  }
}
