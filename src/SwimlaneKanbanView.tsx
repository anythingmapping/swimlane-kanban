import EventEmitter from 'eventemitter3';
import { HoverParent, HoverPopover, Menu, TFile, TextFileView, ViewState, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { Board } from './components/Board';
import { hasFrontmatterKeyRaw } from './parsers/markdown';
import SwimlaneKanbanPlugin from './main';

export const swimlaneKanbanViewType = 'swimlane-kanban';
export const swimlaneKanbanIcon = 'lucide-columns';

export class SwimlaneKanbanView extends TextFileView implements HoverParent {
  plugin: SwimlaneKanbanPlugin;
  hoverPopover: HoverPopover | null;
  emitter: EventEmitter;

  get isPrimary(): boolean {
    return this.plugin.getStateManager(this.file)?.getAView() === this;
  }

  get id(): string {
    // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
    return `${this.leaf.id}:::${this.file?.path}`;
  }

  constructor(leaf: WorkspaceLeaf, plugin: SwimlaneKanbanPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.emitter = new EventEmitter();
  }

  getViewType() {
    return swimlaneKanbanViewType;
  }

  getIcon() {
    return swimlaneKanbanIcon;
  }

  getDisplayText() {
    return this.file?.basename || 'Swimlane kanban';
  }

  getWindow() {
    return this.containerEl.ownerDocument?.defaultView || activeWindow;
  }

  async onLoadFile(file: TFile) {
    this.plugin.removeView(this);
    try {
      return await super.onLoadFile(file);
    } catch (e) {
      const stateManager = this.plugin.stateManagers.get(this.file);
      stateManager?.setError(e);
      throw e;
    }
  }

  onload() {
    super.onload();


    this.register(
      this.containerEl.onWindowMigrated(() => {
        this.plugin.removeView(this);
        this.plugin.addView(this, this.data, this.isPrimary);
      })
    );
  }

  onunload(): void {
    super.onunload();
    this.plugin.removeView(this);
    this.emitter.removeAllListeners();
  }

  handleRename(newPath: string, oldPath: string) {
    if (this.file.path === newPath) {
      this.plugin.handleViewFileRename(this, oldPath);
    }
  }

  requestSaveToDisk(data: string) {
    if (this.data !== data && this.isPrimary) {
      this.data = data;
      this.requestSave();
    } else {
      this.data = data;
    }
  }

  getViewData() {
    return this.data;
  }

  setViewData(data: string, clear?: boolean) {
    if (!hasFrontmatterKeyRaw(data)) {
      // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
      this.plugin.swimlaneKanbanFileModes[this.leaf.id || this.file.path] = 'markdown';
      this.plugin.removeView(this);
      void this.plugin.setMarkdownView(this.leaf, false);
      return;
    }

    if (clear) {
      // Reset state on file change
    }

    this.plugin.addView(this, data, !clear && this.isPrimary);
  }

  async setState(state: ViewState, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
  }

  getState() {
    return super.getState();
  }

  getPortal() {
    const stateManager = this.plugin.stateManagers.get(this.file);
    return <Board stateManager={stateManager} view={this} />;
  }

  onPaneMenu(menu: Menu, source: string) {
    if (source !== 'more-options') {
      super.onPaneMenu(menu, source);
      return;
    }

    menu.addItem((item) => {
      item
        .setTitle('Open as Markdown')
        .setIcon('lucide-file-text')
        .setSection('pane')
        .onClick(() => {
          // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
          this.plugin.swimlaneKanbanFileModes[this.leaf.id || this.file.path] = 'markdown';
          void this.plugin.setMarkdownView(this.leaf);
        });
    });

    super.onPaneMenu(menu, source);
  }

  clear() {
    // Intentionally empty - see obsidian-kanban's explanation
  }
}
