import { around } from 'monkey-around';
import {
  MarkdownView,
  Plugin,
  TFile,
  TFolder,
  ViewState,
  WorkspaceLeaf,
  debounce,
} from 'obsidian';
import { render, unmountComponentAtNode, useEffect, useState } from 'preact/compat';

import { createApp } from './DragDropApp';
import { SwimlaneKanbanView, swimlaneKanbanIcon, swimlaneKanbanViewType } from './SwimlaneKanbanView';
import { SwimlaneKanbanSettingsTab } from './Settings';
import { StateManager } from './StateManager';
import { frontmatterKey, basicFrontmatter } from './parsers/markdown';
import { SwimlaneKanbanSettings } from './types';

interface WindowRegistry {
  viewMap: Map<string, SwimlaneKanbanView>;
  viewStateReceivers: Array<(views: SwimlaneKanbanView[]) => void>;
  appRoot: HTMLElement;
}

export default class SwimlaneKanbanPlugin extends Plugin {
  settingsTab: SwimlaneKanbanSettingsTab;
  settings: SwimlaneKanbanSettings = {};

  swimlaneKanbanFileModes: Record<string, string> = {};
  stateManagers: Map<TFile, StateManager> = new Map();
  windowRegistry: Map<Window, WindowRegistry> = new Map();

  _loaded: boolean = false;

  async loadSettings() {
    this.settings = Object.assign({}, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  applyTheme() {
    this.stateManagers.forEach((manager) => {
      manager.softRefresh();
    });
  }

  unload(): void {
    super.unload();
    void Promise.all(
      this.app.workspace.getLeavesOfType(swimlaneKanbanViewType).map((leaf) => {
        // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
        this.swimlaneKanbanFileModes[leaf.id] = 'markdown';
        return this.setMarkdownView(leaf);
      })
    );
  }

  onunload() {
    this.windowRegistry.forEach((reg, win) => {
      reg.viewStateReceivers.forEach((fn) => fn([]));
      this.unmount(win);
    });

    this.unmount(window);
    this.stateManagers.clear();
    this.windowRegistry.clear();
    this.swimlaneKanbanFileModes = {};
  }

  async onload() {
    await this.loadSettings();

    this.settingsTab = new SwimlaneKanbanSettingsTab(this.app, this);
    this.addSettingTab(this.settingsTab);

    this.registerView(swimlaneKanbanViewType, (leaf) => new SwimlaneKanbanView(leaf, this));
    this.registerMonkeyPatches();
    this.registerCommands();
    this.registerEvents();

    this.mount(window);

    // @ts-expect-error undocumented Obsidian API: Workspace.floatingSplit
    this.app.workspace.floatingSplit?.children?.forEach((c: { win: Window }) => {
      this.mount(c.win);
    });

    this.registerEvent(
      this.app.workspace.on('window-open', (_: unknown, win: Window) => {
        this.mount(win);
      })
    );

    this.registerEvent(
      this.app.workspace.on('window-close', (_: unknown, win: Window) => {
        this.unmount(win);
      })
    );

    this.addRibbonIcon(swimlaneKanbanIcon, 'Create new swimlane kanban board', () => {
      void this.newBoard();
    });

    this._loaded = true;
  }

  getSwimlaneKanbanViews(win: Window) {
    const reg = this.windowRegistry.get(win);
    if (reg) return Array.from(reg.viewMap.values());
    return [];
  }

  getSwimlaneKanbanView(id: string, win: Window) {
    const reg = this.windowRegistry.get(win);
    if (reg?.viewMap.has(id)) return reg.viewMap.get(id);
    for (const r of this.windowRegistry.values()) {
      if (r.viewMap.has(id)) return r.viewMap.get(id);
    }
    return null;
  }

  getStateManager(file: TFile) {
    return this.stateManagers.get(file);
  }

  useSwimlaneKanbanViews(win: Window): SwimlaneKanbanView[] {
    const [state, setState] = useState(this.getSwimlaneKanbanViews(win));

    useEffect(() => {
      const reg = this.windowRegistry.get(win);
      reg?.viewStateReceivers.push(setState);
      return () => {
        reg?.viewStateReceivers.remove(setState);
      };
    }, [win]);

    return state;
  }

  addView(view: SwimlaneKanbanView, data: string, shouldParseData: boolean) {
    const win = view.getWindow();
    const reg = this.windowRegistry.get(win);
    if (!reg) return;

    if (!reg.viewMap.has(view.id)) {
      reg.viewMap.set(view.id, view);
    }

    const file = view.file;

    if (this.stateManagers.has(file)) {
      this.stateManagers.get(file).registerView(view, data, shouldParseData);
    } else {
      this.stateManagers.set(
        file,
        new StateManager(
          this.app,
          view,
          data,
          () => this.stateManagers.delete(file),
          () => this.settings
        )
      );
    }

    reg.viewStateReceivers.forEach((fn) => fn(this.getSwimlaneKanbanViews(win)));
  }

  removeView(view: SwimlaneKanbanView) {
    // Search by object reference, not view.id, because view.id is a dynamic
    // getter based on this.file which Obsidian may have already changed to the
    // new file before our onLoadFile handler runs.
    let targetWin: Window | undefined;
    let targetReg: WindowRegistry | undefined;
    let targetId: string | undefined;

    for (const [win, reg] of this.windowRegistry.entries()) {
      for (const [id, v] of reg.viewMap.entries()) {
        if (v === view) {
          targetWin = win;
          targetReg = reg;
          targetId = id;
          break;
        }
      }
      if (targetReg) break;
    }

    if (!targetReg || !targetId) return;

    targetReg.viewMap.delete(targetId);

    // Unregister from whichever stateManager owns this view (view.file may
    // already point to the new file, so we can't rely on it for the lookup).
    for (const manager of this.stateManagers.values()) {
      if (manager.viewSet.has(view)) {
        manager.unregisterView(view);
        break;
      }
    }

    targetReg.viewStateReceivers.forEach((fn) => fn(this.getSwimlaneKanbanViews(targetWin)));
  }

  handleViewFileRename(view: SwimlaneKanbanView, oldPath: string) {
    const win = view.getWindow();
    if (!this.windowRegistry.has(win)) return;

    const reg = this.windowRegistry.get(win);
    // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
    const oldId = `${view.leaf.id}:::${oldPath}`;

    if (reg.viewMap.has(oldId)) {
      reg.viewMap.delete(oldId);
    }
    if (!reg.viewMap.has(view.id)) {
      reg.viewMap.set(view.id, view);
    }

    if (view.isPrimary) {
      this.getStateManager(view.file)?.softRefresh();
    }
  }

  mount(win: Window) {
    if (this.windowRegistry.has(win)) return;

    const el = win.document.body.createDiv();
    this.windowRegistry.set(win, {
      viewMap: new Map(),
      viewStateReceivers: [],
      appRoot: el,
    });

    render(createApp(win, this), el);
  }

  unmount(win: Window) {
    if (!this.windowRegistry.has(win)) return;

    const reg = this.windowRegistry.get(win);

    for (const view of reg.viewMap.values()) {
      this.removeView(view);
    }

    unmountComponentAtNode(reg.appRoot);
    reg.appRoot.remove();
    reg.viewMap.clear();
    reg.viewStateReceivers.length = 0;
    reg.appRoot = null;

    this.windowRegistry.delete(win);
  }

  async setMarkdownView(leaf: WorkspaceLeaf, focus: boolean = true) {
    await leaf.setViewState(
      {
        type: 'markdown',
        state: leaf.view.getState(),
        popstate: true,
      } as ViewState,
      { focus }
    );
  }

  async setSwimlaneKanbanView(leaf: WorkspaceLeaf) {
    await leaf.setViewState({
      type: swimlaneKanbanViewType,
      state: leaf.view.getState(),
      popstate: true,
    } as ViewState);
  }

  async newBoard(folder?: TFolder) {
    const targetFolder = folder
      ? folder
      : this.app.fileManager.getNewFileParent(
          this.app.workspace.getActiveFile()?.path || ''
        );

    try {
      // @ts-expect-error undocumented Obsidian API: FileManager.createNewMarkdownFile
    const file: TFile = await this.app.fileManager.createNewMarkdownFile(
        targetFolder,
        'Untitled Swimlane Kanban'
      );

      await this.app.vault.modify(file, basicFrontmatter);
      await this.app.workspace.getLeaf().setViewState({
        type: swimlaneKanbanViewType,
        state: { file: file.path },
      });
    } catch (e) {
      console.error('Error creating swimlane kanban board:', e);
    }
  }

  registerEvents() {
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, source, leaf) => {
        if (source === 'link-context-menu') return;

        const fileIsFile = file instanceof TFile;
        const fileIsFolder = file instanceof TFolder;
        const leafIsMarkdown = leaf?.view instanceof MarkdownView;
        const leafIsSwimlaneKanban = leaf?.view instanceof SwimlaneKanbanView;

        if (fileIsFolder) {
          menu.addItem((item) => {
            item
              .setSection('action-primary')
              .setTitle('New swimlane kanban board')
              .setIcon(swimlaneKanbanIcon)
              .onClick(() => void this.newBoard(file));
          });
          return;
        }

        if (
          leafIsMarkdown &&
          fileIsFile &&
          ['more-options', 'pane-more-options', 'tab-header'].includes(source) &&
          this.hasFrontmatterKey(file)
        ) {
          menu.addItem((item) => {
            item
              .setTitle('Open as swimlane kanban')
              .setIcon(swimlaneKanbanIcon)
              .setSection('pane')
              .onClick(() => {
                // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
                this.swimlaneKanbanFileModes[leaf.id || file.path] = swimlaneKanbanViewType;
                void this.setSwimlaneKanbanView(leaf);
              });
          });
        }

        if (fileIsFile && leafIsSwimlaneKanban) {
          if (['pane-more-options', 'tab-header'].includes(source)) {
            menu.addItem((item) => {
              item
                .setTitle('Open as Markdown')
                .setIcon('lucide-file-text')
                .setSection('pane')
                .onClick(() => {
                  // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
                  this.swimlaneKanbanFileModes[leaf.id || file.path] = 'markdown';
                  void this.setMarkdownView(leaf);
                });
            });
          }
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        const leaves = this.app.workspace.getLeavesOfType(swimlaneKanbanViewType);
        leaves.forEach((leaf) => {
          (leaf.view as SwimlaneKanbanView).handleRename(file.path, oldPath);
        });
      })
    );

    const notifyFileChange = debounce(
      (file: TFile) => {
        this.stateManagers.forEach((manager) => {
          if (manager.file !== file) {
            manager.forceRefresh();
          }
        });
      },
      2000,
      true
    );

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          notifyFileChange(file);
        }
      })
    );
  }

  hasFrontmatterKey(file: TFile): boolean {
    if (!file) return false;
    const cache = this.app.metadataCache.getFileCache(file);
    return !!cache?.frontmatter?.[frontmatterKey];
  }

  registerCommands() {
    this.addCommand({
      id: 'create-new-board',
      name: 'Create new board',
      callback: () => void this.newBoard(),
    });

    this.addCommand({
      id: 'toggle-view',
      name: 'Toggle between kanban and Markdown mode',
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return false;

        const fileCache = this.app.metadataCache.getFileCache(activeFile);
        const fileIsSwimlaneKanban =
          !!fileCache?.frontmatter && !!fileCache.frontmatter[frontmatterKey];

        if (checking) return fileIsSwimlaneKanban;

        const activeView = this.app.workspace.getActiveViewOfType(SwimlaneKanbanView);

        if (activeView) {
          // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
          this.swimlaneKanbanFileModes[activeView.leaf.id || activeFile.path] = 'markdown';
          void this.setMarkdownView(activeView.leaf);
        } else if (fileIsSwimlaneKanban) {
          const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (mdView) {
            // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
            this.swimlaneKanbanFileModes[mdView.leaf.id || activeFile.path] = swimlaneKanbanViewType;
            void this.setSwimlaneKanbanView(mdView.leaf);
          }
        }
      },
    });
  }

  registerMonkeyPatches() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- `self` is needed because monkey-patched functions bind `this` to the WorkspaceLeaf instance
    const self = this;

    // Monkey patch WorkspaceLeaf to open swimlane-kanban files with SwimlaneKanbanView by default
    this.register(
      around(WorkspaceLeaf.prototype, {
        detach(next) {
          return function () {
            const state = this.view?.getState();
            const leafId = (this as WorkspaceLeaf & { id?: string }).id;
            if (state?.file && self.swimlaneKanbanFileModes[leafId || state.file]) {
              delete self.swimlaneKanbanFileModes[leafId || state.file];
            }
            return next.apply(this);
          };
        },

        setViewState(next) {
          return function (state: ViewState, ...rest: unknown[]) {
            const filePath = state.state?.file as string | undefined;
            if (
              self._loaded &&
              state.type === 'markdown' &&
              filePath &&
              self.swimlaneKanbanFileModes[(this as WorkspaceLeaf & { id?: string }).id || filePath] !== 'markdown'
            ) {
              const cache = self.app.metadataCache.getCache(filePath);

              if (cache?.frontmatter && cache.frontmatter[frontmatterKey]) {
                const newState = {
                  ...state,
                  type: swimlaneKanbanViewType,
                };
                self.swimlaneKanbanFileModes[filePath] = swimlaneKanbanViewType;
                return next.apply(this, [newState, ...rest]);
              }
            }
            return next.apply(this, [state, ...rest]);
          };
        },
      })
    );
  }
}
