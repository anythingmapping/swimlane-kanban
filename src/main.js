import { around } from 'monkey-around';
import { MarkdownView, Plugin, TFile, TFolder, WorkspaceLeaf, debounce, } from 'obsidian';
import { render, unmountComponentAtNode, useEffect, useState } from 'preact/compat';
import { createApp } from './DragDropApp';
import { SwimlaneKanbanView, swimlaneKanbanIcon, swimlaneKanbanViewType } from './SwimlaneKanbanView';
import { SwimlaneKanbanSettingsTab } from './Settings';
import { StateManager } from './StateManager';
import { frontmatterKey, basicFrontmatter } from './parsers/markdown';
export default class SwimlaneKanbanPlugin extends Plugin {
    constructor() {
        super(...arguments);
        this.settings = {};
        this.swimlaneKanbanFileModes = {};
        this.stateManagers = new Map();
        this.windowRegistry = new Map();
        this._loaded = false;
    }
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
    unload() {
        super.unload();
        void Promise.all(this.app.workspace.getLeavesOfType(swimlaneKanbanViewType).map((leaf) => {
            // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
            this.swimlaneKanbanFileModes[leaf.id] = 'markdown';
            return this.setMarkdownView(leaf);
        }));
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
        var _a, _b;
        await this.loadSettings();
        this.settingsTab = new SwimlaneKanbanSettingsTab(this.app, this);
        this.addSettingTab(this.settingsTab);
        this.registerView(swimlaneKanbanViewType, (leaf) => new SwimlaneKanbanView(leaf, this));
        this.registerMonkeyPatches();
        this.registerCommands();
        this.registerEvents();
        this.mount(window);
        // @ts-expect-error undocumented Obsidian API: Workspace.floatingSplit
        (_b = (_a = this.app.workspace.floatingSplit) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.forEach((c) => {
            this.mount(c.win);
        });
        this.registerEvent(this.app.workspace.on('window-open', (_, win) => {
            this.mount(win);
        }));
        this.registerEvent(this.app.workspace.on('window-close', (_, win) => {
            this.unmount(win);
        }));
        this.addRibbonIcon(swimlaneKanbanIcon, 'Create new swimlane kanban board', () => {
            void this.newBoard();
        });
        this._loaded = true;
    }
    getSwimlaneKanbanViews(win) {
        const reg = this.windowRegistry.get(win);
        if (reg)
            return Array.from(reg.viewMap.values());
        return [];
    }
    getSwimlaneKanbanView(id, win) {
        const reg = this.windowRegistry.get(win);
        if (reg === null || reg === void 0 ? void 0 : reg.viewMap.has(id))
            return reg.viewMap.get(id);
        for (const r of this.windowRegistry.values()) {
            if (r.viewMap.has(id))
                return r.viewMap.get(id);
        }
        return null;
    }
    getStateManager(file) {
        return this.stateManagers.get(file);
    }
    useSwimlaneKanbanViews(win) {
        const [state, setState] = useState(this.getSwimlaneKanbanViews(win));
        useEffect(() => {
            const reg = this.windowRegistry.get(win);
            reg === null || reg === void 0 ? void 0 : reg.viewStateReceivers.push(setState);
            return () => {
                reg === null || reg === void 0 ? void 0 : reg.viewStateReceivers.remove(setState);
            };
        }, [win]);
        return state;
    }
    addView(view, data, shouldParseData) {
        const win = view.getWindow();
        const reg = this.windowRegistry.get(win);
        if (!reg)
            return;
        if (!reg.viewMap.has(view.id)) {
            reg.viewMap.set(view.id, view);
        }
        const file = view.file;
        if (this.stateManagers.has(file)) {
            this.stateManagers.get(file).registerView(view, data, shouldParseData);
        }
        else {
            this.stateManagers.set(file, new StateManager(this.app, view, data, () => this.stateManagers.delete(file), () => this.settings));
        }
        reg.viewStateReceivers.forEach((fn) => fn(this.getSwimlaneKanbanViews(win)));
    }
    removeView(view) {
        // Search by object reference, not view.id, because view.id is a dynamic
        // getter based on this.file which Obsidian may have already changed to the
        // new file before our onLoadFile handler runs.
        let targetWin;
        let targetReg;
        let targetId;
        for (const [win, reg] of this.windowRegistry.entries()) {
            for (const [id, v] of reg.viewMap.entries()) {
                if (v === view) {
                    targetWin = win;
                    targetReg = reg;
                    targetId = id;
                    break;
                }
            }
            if (targetReg)
                break;
        }
        if (!targetReg || !targetId)
            return;
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
    handleViewFileRename(view, oldPath) {
        var _a;
        const win = view.getWindow();
        if (!this.windowRegistry.has(win))
            return;
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
            (_a = this.getStateManager(view.file)) === null || _a === void 0 ? void 0 : _a.softRefresh();
        }
    }
    mount(win) {
        if (this.windowRegistry.has(win))
            return;
        const el = win.document.body.createDiv();
        this.windowRegistry.set(win, {
            viewMap: new Map(),
            viewStateReceivers: [],
            appRoot: el,
        });
        render(createApp(win, this), el);
    }
    unmount(win) {
        if (!this.windowRegistry.has(win))
            return;
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
    async setMarkdownView(leaf, focus = true) {
        await leaf.setViewState({
            type: 'markdown',
            state: leaf.view.getState(),
            popstate: true,
        }, { focus });
    }
    async setSwimlaneKanbanView(leaf) {
        await leaf.setViewState({
            type: swimlaneKanbanViewType,
            state: leaf.view.getState(),
            popstate: true,
        });
    }
    async newBoard(folder) {
        var _a;
        const targetFolder = folder
            ? folder
            : this.app.fileManager.getNewFileParent(((_a = this.app.workspace.getActiveFile()) === null || _a === void 0 ? void 0 : _a.path) || '');
        try {
            // @ts-expect-error undocumented Obsidian API: FileManager.createNewMarkdownFile
            const file = await this.app.fileManager.createNewMarkdownFile(targetFolder, 'Untitled Swimlane Kanban');
            await this.app.vault.modify(file, basicFrontmatter);
            await this.app.workspace.getLeaf().setViewState({
                type: swimlaneKanbanViewType,
                state: { file: file.path },
            });
        }
        catch (e) {
            console.error('Error creating swimlane kanban board:', e);
        }
    }
    registerEvents() {
        this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source, leaf) => {
            if (source === 'link-context-menu')
                return;
            const fileIsFile = file instanceof TFile;
            const fileIsFolder = file instanceof TFolder;
            const leafIsMarkdown = (leaf === null || leaf === void 0 ? void 0 : leaf.view) instanceof MarkdownView;
            const leafIsSwimlaneKanban = (leaf === null || leaf === void 0 ? void 0 : leaf.view) instanceof SwimlaneKanbanView;
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
            if (leafIsMarkdown &&
                fileIsFile &&
                ['more-options', 'pane-more-options', 'tab-header'].includes(source) &&
                this.hasFrontmatterKey(file)) {
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
                            .setTitle('Open as markdown')
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
        }));
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            const leaves = this.app.workspace.getLeavesOfType(swimlaneKanbanViewType);
            leaves.forEach((leaf) => {
                leaf.view.handleRename(file.path, oldPath);
            });
        }));
        const notifyFileChange = debounce((file) => {
            this.stateManagers.forEach((manager) => {
                if (manager.file !== file) {
                    manager.forceRefresh();
                }
            });
        }, 2000, true);
        this.registerEvent(this.app.vault.on('modify', (file) => {
            if (file instanceof TFile) {
                notifyFileChange(file);
            }
        }));
    }
    hasFrontmatterKey(file) {
        var _a;
        if (!file)
            return false;
        const cache = this.app.metadataCache.getFileCache(file);
        return !!((_a = cache === null || cache === void 0 ? void 0 : cache.frontmatter) === null || _a === void 0 ? void 0 : _a[frontmatterKey]);
    }
    registerCommands() {
        this.addCommand({
            id: 'create-new-board',
            name: 'Create new board',
            callback: () => void this.newBoard(),
        });
        this.addCommand({
            id: 'toggle-view',
            name: 'Toggle between swimlane kanban and markdown mode',
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile)
                    return false;
                const fileCache = this.app.metadataCache.getFileCache(activeFile);
                const fileIsSwimlaneKanban = !!(fileCache === null || fileCache === void 0 ? void 0 : fileCache.frontmatter) && !!fileCache.frontmatter[frontmatterKey];
                if (checking)
                    return fileIsSwimlaneKanban;
                const activeView = this.app.workspace.getActiveViewOfType(SwimlaneKanbanView);
                if (activeView) {
                    // @ts-expect-error undocumented Obsidian API: WorkspaceLeaf.id
                    this.swimlaneKanbanFileModes[activeView.leaf.id || activeFile.path] = 'markdown';
                    void this.setMarkdownView(activeView.leaf);
                }
                else if (fileIsSwimlaneKanban) {
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
        this.register(around(WorkspaceLeaf.prototype, {
            detach(next) {
                return function () {
                    var _a;
                    const state = (_a = this.view) === null || _a === void 0 ? void 0 : _a.getState();
                    const leafId = this.id;
                    if ((state === null || state === void 0 ? void 0 : state.file) && self.swimlaneKanbanFileModes[leafId || state.file]) {
                        delete self.swimlaneKanbanFileModes[leafId || state.file];
                    }
                    return next.apply(this);
                };
            },
            setViewState(next) {
                return function (state, ...rest) {
                    var _a;
                    const filePath = (_a = state.state) === null || _a === void 0 ? void 0 : _a.file;
                    if (self._loaded &&
                        state.type === 'markdown' &&
                        filePath &&
                        self.swimlaneKanbanFileModes[this.id || filePath] !== 'markdown') {
                        const cache = self.app.metadataCache.getCache(filePath);
                        if ((cache === null || cache === void 0 ? void 0 : cache.frontmatter) && cache.frontmatter[frontmatterKey]) {
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
        }));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQ0wsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBQ0wsT0FBTyxFQUVQLGFBQWEsRUFDYixRQUFRLEdBQ1QsTUFBTSxVQUFVLENBQUM7QUFDbEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXBGLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLHNCQUFzQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDdEcsT0FBTyxFQUFFLHlCQUF5QixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ3ZELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUF3QixNQUFNLG9CQUFvQixDQUFDO0FBUzVGLE1BQU0sQ0FBQyxPQUFPLE9BQU8sb0JBQXFCLFNBQVEsTUFBTTtJQUF4RDs7UUFFRSxhQUFRLEdBQTJCLEVBQUUsQ0FBQztRQUV0Qyw0QkFBdUIsR0FBMkIsRUFBRSxDQUFDO1FBQ3JELGtCQUFhLEdBQTZCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDcEQsbUJBQWMsR0FBZ0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV4RCxZQUFPLEdBQVksS0FBSyxDQUFDO0lBNGIzQixDQUFDO0lBMWJDLEtBQUssQ0FBQyxZQUFZO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsS0FBSyxD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QyxLQUFLLFVBQVUsRUFDckcsQ0FBQzt3QkFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBRXhELElBQUksQ0FBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsV0FBVyxLQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQzs0QkFDNUQsTUFBTSxRQUFRLEdBQUc7Z0NBQ2YsR0FBRyxLQUFLO2dDQUNSLElBQUksRUFBRSxzQkFBc0I7NkJBQzdCLENBQUM7NEJBQ0YsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxHQUFHLHNCQUFzQixDQUFDOzRCQUNoRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDL0MsQ0FBQztvQkFDSCxDQUFDO29CQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDLENBQUM7WUFDSixDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhcm91bmQgfSBmcm9tICdtb25rZXktYXJvdW5kJztcbmltcG9ydCB7XG4gIE1hcmtkb3duVmlldyxcbiAgUGx1Z2luLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgVmlld1N0YXRlLFxuICBXb3Jrc3BhY2VMZWFmLFxuICBkZWJvdW5jZSxcbn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgcmVuZGVyLCB1bm1vdW50Q29tcG9uZW50QXROb2RlLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncHJlYWN0L2NvbXBhdCc7XG5cbmltcG9ydCB7IGNyZWF0ZUFwcCB9IGZyb20gJy4vRHJhZ0Ryb3BBcHAnO1xuaW1wb3J0IHsgU3dpbWxhbmVLYW5iYW5WaWV3LCBzd2ltbGFuZUthbmJhbkljb24sIHN3aW1sYW5lS2FuYmFuVmlld1R5cGUgfSBmcm9tICcuL1N3aW1sYW5lS2FuYmFuVmlldyc7XG5pbXBvcnQgeyBTd2ltbGFuZUthbmJhblNldHRpbmdzVGFiIH0gZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgeyBTdGF0ZU1hbmFnZXIgfSBmcm9tICcuL1N0YXRlTWFuYWdlcic7XG5pbXBvcnQgeyBmcm9udG1hdHRlcktleSwgYmFzaWNGcm9udG1hdHRlciwgaGFzRnJvbnRtYXR0ZXJLZXlSYXcgfSBmcm9tICcuL3BhcnNlcnMvbWFya2Rvd24nO1xuaW1wb3J0IHsgU3dpbWxhbmVLYW5iYW5TZXR0aW5ncyB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbnRlcmZhY2UgV2luZG93UmVnaXN0cnkge1xuICB2aWV3TWFwOiBNYXA8c3RyaW5nLCBTd2ltbGFuZUthbmJhblZpZXc+O1xuICB2aWV3U3RhdGVSZWNlaXZlcnM6IEFycmF5PCh2aWV3czogU3dpbWxhbmVLYW5iYW5WaWV3W10pID0+IHZvaWQ+O1xuICBhcHBSb290OiBIVE1MRWxlbWVudDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3dpbWxhbmVLYW5iYW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nc1RhYjogU3dpbWxhbmVLYW5iYW5TZXR0aW5nc1RhYjtcbiAgc2V0dGluZ3M6IFN3aW1sYW5lS2FuYmFuU2V0dGluZ3MgPSB7fTtcblxuICBzd2ltbGFuZUthbmJhbkZpbGVNb2RlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBzdGF0ZU1hbmFnZXJzOiBNYXA8VEZpbGUsIFN0YXRlTWFuYWdlcj4gPSBuZXcgTWFwKCk7XG4gIHdpbmRvd1JlZ2lzdHJ5OiBNYXA8V2luZG93LCBXaW5kb3dSZWdpc3RyeT4gPSBuZXcgTWFwKCk7XG5cbiAgX2xvYWRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgYXBwbHlUaGVtZSgpIHtcbiAgICB0aGlzLnN0YXRlTWFuYWdlcnMuZm9yRWFjaCgobWFuYWdlcikgPT4ge1xuICAgICAgbWFuYWdlci5zb2Z0UmVmcmVzaCgpO1xuICAgIH0pO1xuICB9XG5cbiAgdW5sb2FkKCk6IHZvaWQge1xuICAgIHN1cGVyLnVubG9hZCgpO1xuICAgIHZvaWQgUHJvbWlzZS5hbGwoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKHN3aW1sYW5lS2FuYmFuVmlld1R5cGUpLm1hcCgobGVhZikgPT4ge1xuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHVuZG9jdW1lbnRlZCBPYnNpZGlhbiBBUEk6IFdvcmtzcGFjZUxlYWYuaWRcbiAgICAgICAgdGhpcy5zd2ltbGFuZUthbmJhbkZpbGVNb2Rlc1tsZWFmLmlkXSA9ICdtYXJrZG93bic7XG4gICAgICAgIHJldHVybiB0aGlzLnNldE1hcmtkb3duVmlldyhsZWFmKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIG9udW5sb2FkKCkge1xuICAgIHRoaXMud2luZG93UmVnaXN0cnkuZm9yRWFjaCgocmVnLCB3aW4pID0+IHtcbiAgICAgIHJlZy52aWV3U3RhdGVSZWNlaXZlcnMuZm9yRWFjaCgoZm4pID0+IGZuKFtdKSk7XG4gICAgICB0aGlzLnVubW91bnQod2luKTtcbiAgICB9KTtcblxuICAgIHRoaXMudW5tb3VudCh3aW5kb3cpO1xuICAgIHRoaXMuc3RhdGVNYW5hZ2Vycy5jbGVhcigpO1xuICAgIHRoaXMud2luZG93UmVnaXN0cnkuY2xlYXIoKTtcbiAgICB0aGlzLnN3aW1sYW5lS2FuYmFuRmlsZU1vZGVzID0ge307XG4gIH1cblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMuc2V0dGluZ3NUYWIgPSBuZXcgU3dpbWxhbmVLYW5iYW5TZXR0aW5nc1RhYih0aGlzLmFwcCwgdGhpcyk7XG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKHRoaXMuc2V0dGluZ3NUYWIpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoc3dpbWxhbmVLYW5iYW5WaWV3VHlwZSwgKGxlYWYpID0+IG5ldyBTd2ltbGFuZUthbmJhblZpZXcobGVhZiwgdGhpcykpO1xuICAgIHRoaXMucmVnaXN0ZXJNb25rZXlQYXRjaGVzKCk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmRzKCk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50cygpO1xuXG4gICAgdGhpcy5tb3VudCh3aW5kb3cpO1xuXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciB1bmRvY3VtZW50ZWQgT2JzaWRpYW4gQVBJOiBXb3Jrc3BhY2UuZmxvYXRpbmdTcGxpdFxuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5mbG9hdGluZ1NwbGl0Py5jaGlsZHJlbj8uZm9yRWFjaCgoYzogeyB3aW46IFdpbmRvdyB9KSA9PiB7XG4gICAgICB0aGlzLm1vdW50KGMud2luKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbignd2luZG93LW9wZW4nLCAoXzogdW5rbm93biwgd2luOiBXaW5kb3cpID0+IHtcbiAgICAgICAgdGhpcy5tb3VudCh3aW4pO1xuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKCd3aW5kb3ctY2xvc2UnLCAoXzogdW5rbm93biwgd2luOiBXaW5kb3cpID0+IHtcbiAgICAgICAgdGhpcy51bm1vdW50KHdpbik7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oc3dpbWxhbmVLYW5iYW5JY29uLCAnQ3JlYXRlIG5ldyBzd2ltbGFuZSBrYW5iYW4gYm9hcmQnLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMubmV3Qm9hcmQoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2xvYWRlZCA9IHRydWU7XG4gIH1cblxuICBnZXRTd2ltbGFuZUthbmJhblZpZXdzKHdpbjogV2luZG93KSB7XG4gICAgY29uc3QgcmVnID0gdGhpcy53aW5kb3dSZWdpc3RyeS5nZXQod2luKTtcbiAgICBpZiAocmVnKSByZXR1cm4gQXJyYXkuZnJvbShyZWcudmlld01hcC52YWx1ZXMoKSk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0U3dpbWxhbmVLYW5iYW5WaWV3KGlkOiBzdHJpbmcsIHdpbjogV2luZG93KSB7XG4gICAgY29uc3QgcmVnID0gdGhpcy53aW5kb3dSZWdpc3RyeS5nZXQod2luKTtcbiAgICBpZiAocmVnPy52aWV3TWFwLmhhcyhpZCkpIHJldHVybiByZWcudmlld01hcC5nZXQoaWQpO1xuICAgIGZvciAoY29uc3QgciBvZiB0aGlzLndpbmRvd1JlZ2lzdHJ5LnZhbHVlcygpKSB7XG4gICAgICBpZiAoci52aWV3TWFwLmhhcyhpZCkpIHJldHVybiByLnZpZXdNYXAuZ2V0KGlkKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXRTdGF0ZU1hbmFnZXIoZmlsZTogVEZpbGUpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZU1hbmFnZXJzLmdldChmaWxlKTtcbiAgfVxuXG4gIHVzZVN3aW1sYW5lS2FuYmFuVmlld3Mod2luOiBXaW5kb3cpOiBTd2ltbGFuZUthbmJhblZpZXdbXSB7XG4gICAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZSh0aGlzLmdldFN3aW1sYW5lS2FuYmFuVmlld3Mod2luKSk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgY29uc3QgcmVnID0gdGhpcy53aW5kb3dSZWdpc3RyeS5nZXQod2luKTtcbiAgICAgIHJlZz8udmlld1N0YXRlUmVjZWl2ZXJzLnB1c2goc2V0U3RhdGUpO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgcmVnPy52aWV3U3RhdGVSZWNlaXZlcnMucmVtb3ZlKHNldFN0YXRlKTtcbiAgICAgIH07XG4gICAgfSwgW3dpbl0pO1xuXG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgYWRkVmlldyh2aWV3OiBTd2ltbGFuZUthbmJhblZpZXcsIGRhdGE6IHN0cmluZywgc2hvdWxkUGFyc2VEYXRhOiBib29sZWFuKSB7XG4gICAgY29uc3Qgd2luID0gdmlldy5nZXRXaW5kb3coKTtcbiAgICBjb25zdCByZWcgPSB0aGlzLndpbmRvd1JlZ2lzdHJ5LmdldCh3aW4pO1xuICAgIGlmICghcmVnKSByZXR1cm47XG5cbiAgICBpZiAoIXJlZy52aWV3TWFwLmhhcyh2aWV3LmlkKSkge1xuICAgICAgcmVnLnZpZXdNYXAuc2V0KHZpZXcuaWQsIHZpZXcpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSB2aWV3LmZpbGU7XG5cbiAgICBpZiAodGhpcy5zdGF0ZU1hbmFnZXJzLmhhcyhmaWxlKSkge1xuICAgICAgdGhpcy5zdGF0ZU1hbmFnZXJzLmdldChmaWxlKS5yZWdpc3RlclZpZXcodmlldywgZGF0YSwgc2hvdWxkUGFyc2VEYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZU1hbmFnZXJzLnNldChcbiAgICAgICAgZmlsZSxcbiAgICAgICAgbmV3IFN0YXRlTWFuYWdlcihcbiAgICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgICB2aWV3LFxuICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgKCkgPT4gdGhpcy5zdGF0ZU1hbmFnZXJzLmRlbGV0ZShmaWxlKSxcbiAgICAgICAgICAoKSA9PiB0aGlzLnNldHRpbmdzXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmVnLnZpZXdTdGF0ZVJlY2VpdmVycy5mb3JFYWNoKChmbikgPT4gZm4odGhpcy5nZXRTd2ltbGFuZUthbmJhblZpZXdzKHdpbikpKTtcbiAgfVxuXG4gIHJlbW92ZVZpZXcodmlldzogU3dpbWxhbmVLYW5iYW5WaWV3KSB7XG4gICAgLy8gU2VhcmNoIGJ5IG9iamVjdCByZWZlcmVuY2UsIG5vdCB2aWV3LmlkLCBiZWNhdXNlIHZpZXcuaWQgaXMgYSBkeW5hbWljXG4gICAgLy8gZ2V0dGVyIGJhc2VkIG9uIHRoaXMuZmlsZSB3aGljaCBPYnNpZGlhbiBtYXkgaGF2ZSBhbHJlYWR5IGNoYW5nZWQgdG8gdGhlXG4gICAgLy8gbmV3IGZpbGUgYmVmb3JlIG91ciBvbkxvYWRGaWxlIGhhbmRsZXIgcnVucy5cbiAgICBsZXQgdGFyZ2V0V2luOiBXaW5kb3cgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHRhcmdldFJlZzogV2luZG93UmVnaXN0cnkgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHRhcmdldElkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgICBmb3IgKGNvbnN0IFt3aW4sIHJlZ10gb2YgdGhpcy53aW5kb3dSZWdpc3RyeS5lbnRyaWVzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgW2lkLCB2XSBvZiByZWcudmlld01hcC5lbnRyaWVzKCkpIHtcbiAgICAgICAgaWYgKHYgPT09IHZpZXcpIHtcbiAgICAgICAgICB0YXJnZXRXaW4gPSB3aW47XG4gICAgICAgICAgdGFyZ2V0UmVnID0gcmVnO1xuICAgICAgICAgIHRhcmdldElkID0gaWQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0YXJnZXRSZWcpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICghdGFyZ2V0UmVnIHx8ICF0YXJnZXRJZCkgcmV0dXJuO1xuXG4gICAgdGFyZ2V0UmVnLnZpZXdNYXAuZGVsZXRlKHRhcmdldElkKTtcblxuICAgIC8vIFVucmVnaXN0ZXIgZnJvbSB3aGljaGV2ZXIgc3RhdGVNYW5hZ2VyIG93bnMgdGhpcyB2aWV3ICh2aWV3LmZpbGUgbWF5XG4gICAgLy8gYWxyZWFkeSBwb2ludCB0byB0aGUgbmV3IGZpbGUsIHNvIHdlIGNhbid0IHJlbHkgb24gaXQgZm9yIHRoZSBsb29rdXApLlxuICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiB0aGlzLnN0YXRlTWFuYWdlcnMudmFsdWVzKCkpIHtcbiAgICAgIGlmIChtYW5hZ2VyLnZpZXdTZXQuaGFzKHZpZXcpKSB7XG4gICAgICAgIG1hbmFnZXIudW5yZWdpc3RlclZpZXcodmlldyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRhcmdldFJlZy52aWV3U3RhdGVSZWNlaXZlcnMuZm9yRWFjaCgoZm4pID0+IGZuKHRoaXMuZ2V0U3dpbWxhbmVLYW5iYW5WaWV3cyh0YXJnZXRXaW4pKSk7XG4gIH1cblxuICBoYW5kbGVWaWV3RmlsZVJlbmFtZSh2aWV3OiBTd2ltbGFuZUthbmJhblZpZXcsIG9sZFBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHdpbiA9IHZpZXcuZ2V0V2luZG93KCk7XG4gICAgaWYgKCF0aGlzLndpbmRvd1JlZ2lzdHJ5Lmhhcyh3aW4pKSByZXR1cm47XG5cbiAgICBjb25zdCByZWcgPSB0aGlzLndpbmRvd1JlZ2lzdHJ5LmdldCh3aW4pO1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgdW5kb2N1bWVudGVkIE9ic2lkaWFuIEFQSTogV29ya3NwYWNlTGVhZi5pZFxuICAgIGNvbnN0IG9sZElkID0gYCR7dmlldy5sZWFmLmlkfTo6OiR7b2xkUGF0aH1gO1xuXG4gICAgaWYgKHJlZy52aWV3TWFwLmhhcyhvbGRJZCkpIHtcbiAgICAgIHJlZy52aWV3TWFwLmRlbGV0ZShvbGRJZCk7XG4gICAgfVxuICAgIGlmICghcmVnLnZpZXdNYXAuaGFzKHZpZXcuaWQpKSB7XG4gICAgICByZWcudmlld01hcC5zZXQodmlldy5pZCwgdmlldyk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXcuaXNQcmltYXJ5KSB7XG4gICAgICB0aGlzLmdldFN0YXRlTWFuYWdlcih2aWV3LmZpbGUpPy5zb2Z0UmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIG1vdW50KHdpbjogV2luZG93KSB7XG4gICAgaWYgKHRoaXMud2luZG93UmVnaXN0cnkuaGFzKHdpbikpIHJldHVybjtcblxuICAgIGNvbnN0IGVsID0gd2luLmRvY3VtZW50LmJvZHkuY3JlYXRlRGl2KCk7XG4gICAgdGhpcy53aW5kb3dSZWdpc3RyeS5zZXQod2luLCB7XG4gICAgICB2aWV3TWFwOiBuZXcgTWFwKCksXG4gICAgICB2aWV3U3RhdGVSZWNlaXZlcnM6IFtdLFxuICAgICAgYXBwUm9vdDogZWwsXG4gICAgfSk7XG5cbiAgICByZW5kZXIoY3JlYXRlQXBwKHdpbiwgdGhpcyksIGVsKTtcbiAgfVxuXG4gIHVubW91bnQod2luOiBXaW5kb3cpIHtcbiAgICBpZiAoIXRoaXMud2luZG93UmVnaXN0cnkuaGFzKHdpbikpIHJldHVybjtcblxuICAgIGNvbnN0IHJlZyA9IHRoaXMud2luZG93UmVnaXN0cnkuZ2V0KHdpbik7XG5cbiAgICBmb3IgKGNvbnN0IHZpZXcgb2YgcmVnLnZpZXdNYXAudmFsdWVzKCkpIHtcbiAgICAgIHRoaXMucmVtb3ZlVmlldyh2aWV3KTtcbiAgICB9XG5cbiAgICB1bm1vdW50Q29tcG9uZW50QXROb2RlKHJlZy5hcHBSb290KTtcbiAgICByZWcuYXBwUm9vdC5yZW1vdmUoKTtcbiAgICByZWcudmlld01hcC5jbGVhcigpO1xuICAgIHJlZy52aWV3U3RhdGVSZWNlaXZlcnMubGVuZ3RoID0gMDtcbiAgICByZWcuYXBwUm9vdCA9IG51bGw7XG5cbiAgICB0aGlzLndpbmRvd1JlZ2lzdHJ5LmRlbGV0ZSh3aW4pO1xuICB9XG5cbiAgYXN5bmMgc2V0TWFya2Rvd25WaWV3KGxlYWY6IFdvcmtzcGFjZUxlYWYsIGZvY3VzOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKFxuICAgICAge1xuICAgICAgICB0eXBlOiAnbWFya2Rvd24nLFxuICAgICAgICBzdGF0ZTogbGVhZi52aWV3LmdldFN0YXRlKCksXG4gICAgICAgIHBvcHN0YXRlOiB0cnVlLFxuICAgICAgfSBhcyBWaWV3U3RhdGUsXG4gICAgICB7IGZvY3VzIH1cbiAgICApO1xuICB9XG5cbiAgYXN5bmMgc2V0U3dpbWxhbmVLYW5iYW5WaWV3KGxlYWY6IFdvcmtzcGFjZUxlYWYpIHtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBzd2ltbGFuZUthbmJhblZpZXdUeXBlLFxuICAgICAgc3RhdGU6IGxlYWYudmlldy5nZXRTdGF0ZSgpLFxuICAgICAgcG9wc3RhdGU6IHRydWUsXG4gICAgfSBhcyBWaWV3U3RhdGUpO1xuICB9XG5cbiAgYXN5bmMgbmV3Qm9hcmQoZm9sZGVyPzogVEZvbGRlcikge1xuICAgIGNvbnN0IHRhcmdldEZvbGRlciA9IGZvbGRlclxuICAgICAgPyBmb2xkZXJcbiAgICAgIDogdGhpcy5hcHAuZmlsZU1hbmFnZXIuZ2V0TmV3RmlsZVBhcmVudChcbiAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpPy5wYXRoIHx8ICcnXG4gICAgICAgICk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciB1bmRvY3VtZW50ZWQgT2JzaWRpYW4gQVBJOiBGaWxlTWFuYWdlci5jcmVhdGVOZXdNYXJrZG93bkZpbGVcbiAgICBjb25zdCBmaWxlOiBURmlsZSA9IGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLmNyZWF0ZU5ld01hcmtkb3duRmlsZShcbiAgICAgICAgdGFyZ2V0Rm9sZGVyLFxuICAgICAgICAnVW50aXRsZWQgU3dpbWxhbmUgS2FuYmFuJ1xuICAgICAgKTtcblxuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGJhc2ljRnJvbnRtYXR0ZXIpO1xuICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoKS5zZXRWaWV3U3RhdGUoe1xuICAgICAgICB0eXBlOiBzd2ltbGFuZUthbmJhblZpZXdUeXBlLFxuICAgICAgICBzdGF0ZTogeyBmaWxlOiBmaWxlLnBhdGggfSxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIHN3aW1sYW5lIGthbmJhbiBib2FyZDonLCBlKTtcbiAgICB9XG4gIH1cblxuICByZWdpc3RlckV2ZW50cygpIHtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oJ2ZpbGUtbWVudScsIChtZW51LCBmaWxlLCBzb3VyY2UsIGxlYWYpID0+IHtcbiAgICAgICAgaWYgKHNvdXJjZSA9PT0gJ2xpbmstY29udGV4dC1tZW51JykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGZpbGVJc0ZpbGUgPSBmaWxlIGluc3RhbmNlb2YgVEZpbGU7XG4gICAgICAgIGNvbnN0IGZpbGVJc0ZvbGRlciA9IGZpbGUgaW5zdGFuY2VvZiBURm9sZGVyO1xuICAgICAgICBjb25zdCBsZWFmSXNNYXJrZG93biA9IGxlYWY/LnZpZXcgaW5zdGFuY2VvZiBNYXJrZG93blZpZXc7XG4gICAgICAgIGNvbnN0IGxlYWZJc1N3aW1sYW5lS2FuYmFuID0gbGVhZj8udmlldyBpbnN0YW5jZW9mIFN3aW1sYW5lS2FuYmFuVmlldztcblxuICAgICAgICBpZiAoZmlsZUlzRm9sZGVyKSB7XG4gICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICAgICAgICBpdGVtXG4gICAgICAgICAgICAgIC5zZXRTZWN0aW9uKCdhY3Rpb24tcHJpbWFyeScpXG4gICAgICAgICAgICAgIC5zZXRUaXRsZSgnTmV3IHN3aW1sYW5lIGthbmJhbiBib2FyZCcpXG4gICAgICAgICAgICAgIC5zZXRJY29uKHN3aW1sYW5lS2FuYmFuSWNvbilcbiAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLm5ld0JvYXJkKGZpbGUpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgbGVhZklzTWFya2Rvd24gJiZcbiAgICAgICAgICBmaWxlSXNGaWxlICYmXG4gICAgICAgICAgWydtb3JlLW9wdGlvbnMnLCAncGFuZS1tb3JlLW9wdGlvbnMnLCAndGFiLWhlYWRlciddLmluY2x1ZGVzKHNvdXJjZSkgJiZcbiAgICAgICAgICB0aGlzLmhhc0Zyb250bWF0dGVyS2V5KGZpbGUpXG4gICAgICAgICkge1xuICAgICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgICAuc2V0VGl0bGUoJ09wZW4gYXMgc3dpbWxhbmUga2FuYmFuJylcbiAgICAgICAgICAgICAgLnNldEljb24oc3dpbWxhbmVLYW5iYW5JY29uKVxuICAgICAgICAgICAgICAuc2V0U2VjdGlvbigncGFuZScpXG4gICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHVuZG9jdW1lbnRlZCBPYnNpZGlhbiBBUEk6IFdvcmtzcGFjZUxlYWYuaWRcbiAgICAgICAgICAgICAgICB0aGlzLnN3aW1sYW5lS2FuYmFuRmlsZU1vZGVzW2xlYWYuaWQgfHwgZmlsZS5wYXRoXSA9IHN3aW1sYW5lS2FuYmFuVmlld1R5cGU7XG4gICAgICAgICAgICAgICAgdm9pZCB0aGlzLnNldFN3aW1sYW5lS2FuYmFuVmlldyhsZWFmKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlsZUlzRmlsZSAmJiBsZWFmSXNTd2ltbGFuZUthbmJhbikge1xuICAgICAgICAgIGlmIChbJ3BhbmUtbW9yZS1vcHRpb25zJywgJ3RhYi1oZWFkZXInXS5pbmNsdWRlcyhzb3VyY2UpKSB7XG4gICAgICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgICAgIC5zZXRUaXRsZSgnT3BlbiBhcyBtYXJrZG93bicpXG4gICAgICAgICAgICAgICAgLnNldEljb24oJ2x1Y2lkZS1maWxlLXRleHQnKVxuICAgICAgICAgICAgICAgIC5zZXRTZWN0aW9uKCdwYW5lJylcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHVuZG9jdW1lbnRlZCBPYnNpZGlhbiBBUEk6IFdvcmtzcGFjZUxlYWYuaWRcbiAgICAgICAgICAgICAgICAgIHRoaXMuc3dpbWxhbmVLYW5iYW5GaWxlTW9kZXNbbGVhZi5pZCB8fCBmaWxlLnBhdGhdID0gJ21hcmtkb3duJztcbiAgICAgICAgICAgICAgICAgIHZvaWQgdGhpcy5zZXRNYXJrZG93blZpZXcobGVhZik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKCdyZW5hbWUnLCAoZmlsZSwgb2xkUGF0aCkgPT4ge1xuICAgICAgICBjb25zdCBsZWF2ZXMgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKHN3aW1sYW5lS2FuYmFuVmlld1R5cGUpO1xuICAgICAgICBsZWF2ZXMuZm9yRWFjaCgobGVhZikgPT4ge1xuICAgICAgICAgIChsZWFmLnZpZXcgYXMgU3dpbWxhbmVLYW5iYW5WaWV3KS5oYW5kbGVSZW5hbWUoZmlsZS5wYXRoLCBvbGRQYXRoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBub3RpZnlGaWxlQ2hhbmdlID0gZGVib3VuY2UoXG4gICAgICAoZmlsZTogVEZpbGUpID0+IHtcbiAgICAgICAgdGhpcy5zdGF0ZU1hbmFnZXJzLmZvckVhY2goKG1hbmFnZXIpID0+IHtcbiAgICAgICAgICBpZiAobWFuYWdlci5maWxlICE9PSBmaWxlKSB7XG4gICAgICAgICAgICBtYW5hZ2VyLmZvcmNlUmVmcmVzaCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgMjAwMCxcbiAgICAgIHRydWVcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oJ21vZGlmeScsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICBub3RpZnlGaWxlQ2hhbmdlKGZpbGUpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBoYXNGcm9udG1hdHRlcktleShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgcmV0dXJuICEhY2FjaGU/LmZyb250bWF0dGVyPy5bZnJvbnRtYXR0ZXJLZXldO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kcygpIHtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICdjcmVhdGUtbmV3LWJvYXJkJyxcbiAgICAgIG5hbWU6ICdDcmVhdGUgbmV3IGJvYXJkJyxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMubmV3Qm9hcmQoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogJ3RvZ2dsZS12aWV3JyxcbiAgICAgIG5hbWU6ICdUb2dnbGUgYmV0d2VlbiBzd2ltbGFuZSBrYW5iYW4gYW5kIG1hcmtkb3duIG1vZGUnLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBpZiAoIWFjdGl2ZUZpbGUpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBjb25zdCBmaWxlQ2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShhY3RpdmVGaWxlKTtcbiAgICAgICAgY29uc3QgZmlsZUlzU3dpbWxhbmVLYW5iYW4gPVxuICAgICAgICAgICEhZmlsZUNhY2hlPy5mcm9udG1hdHRlciAmJiAhIWZpbGVDYWNoZS5mcm9udG1hdHRlcltmcm9udG1hdHRlcktleV07XG5cbiAgICAgICAgaWYgKGNoZWNraW5nKSByZXR1cm4gZmlsZUlzU3dpbWxhbmVLYW5iYW47XG5cbiAgICAgICAgY29uc3QgYWN0aXZlVmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKFN3aW1sYW5lS2FuYmFuVmlldyk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZVZpZXcpIHtcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHVuZG9jdW1lbnRlZCBPYnNpZGlhbiBBUEk6IFdvcmtzcGFjZUxlYWYuaWRcbiAgICAgICAgICB0aGlzLnN3aW1sYW5lS2FuYmFuRmlsZU1vZGVzW2FjdGl2ZVZpZXcubGVhZi5pZCB8fCBhY3RpdmVGaWxlLnBhdGhdID0gJ21hcmtkb3duJztcbiAgICAgICAgICB2b2lkIHRoaXMuc2V0TWFya2Rvd25WaWV3KGFjdGl2ZVZpZXcubGVhZik7XG4gICAgICAgIH0gZWxzZSBpZiAoZmlsZUlzU3dpbWxhbmVLYW5iYW4pIHtcbiAgICAgICAgICBjb25zdCBtZFZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICAgIGlmIChtZFZpZXcpIHtcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgdW5kb2N1bWVudGVkIE9ic2lkaWFuIEFQSTogV29ya3NwYWNlTGVhZi5pZFxuICAgICAgICAgICAgdGhpcy5zd2ltbGFuZUthbmJhbkZpbGVNb2Rlc1ttZFZpZXcubGVhZi5pZCB8fCBhY3RpdmVGaWxlLnBhdGhdID0gc3dpbWxhbmVLYW5iYW5WaWV3VHlwZTtcbiAgICAgICAgICAgIHZvaWQgdGhpcy5zZXRTd2ltbGFuZUthbmJhblZpZXcobWRWaWV3LmxlYWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJlZ2lzdGVyTW9ua2V5UGF0Y2hlcygpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXMgLS0gYHNlbGZgIGlzIG5lZWRlZCBiZWNhdXNlIG1vbmtleS1wYXRjaGVkIGZ1bmN0aW9ucyBiaW5kIGB0aGlzYCB0byB0aGUgV29ya3NwYWNlTGVhZiBpbnN0YW5jZVxuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gTW9ua2V5IHBhdGNoIFdvcmtzcGFjZUxlYWYgdG8gb3BlbiBzd2ltbGFuZS1rYW5iYW4gZmlsZXMgd2l0aCBTd2ltbGFuZUthbmJhblZpZXcgYnkgZGVmYXVsdFxuICAgIHRoaXMucmVnaXN0ZXIoXG4gICAgICBhcm91bmQoV29ya3NwYWNlTGVhZi5wcm90b3R5cGUsIHtcbiAgICAgICAgZGV0YWNoKG5leHQpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLnZpZXc/LmdldFN0YXRlKCk7XG4gICAgICAgICAgICBjb25zdCBsZWFmSWQgPSAodGhpcyBhcyBXb3Jrc3BhY2VMZWFmICYgeyBpZD86IHN0cmluZyB9KS5pZDtcbiAgICAgICAgICAgIGlmIChzdGF0ZT8uZmlsZSAmJiBzZWxmLnN3aW1sYW5lS2FuYmFuRmlsZU1vZGVzW2xlYWZJZCB8fCBzdGF0ZS5maWxlXSkge1xuICAgICAgICAgICAgICBkZWxldGUgc2VsZi5zd2ltbGFuZUthbmJhbkZpbGVNb2Rlc1tsZWFmSWQgfHwgc3RhdGUuZmlsZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV4dC5hcHBseSh0aGlzKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldFZpZXdTdGF0ZShuZXh0KSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdGF0ZTogVmlld1N0YXRlLCAuLi5yZXN0OiB1bmtub3duW10pIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gc3RhdGUuc3RhdGU/LmZpbGUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBzZWxmLl9sb2FkZWQgJiZcbiAgICAgICAgICAgICAgc3RhdGUudHlwZSA9PT0gJ21hcmtkb3duJyAmJlxuICAgICAgICAgICAgICBmaWxlUGF0aCAmJlxuICAgICAgICAgICAgICBzZWxmLnN3aW1sYW5lS2FuYmFuRmlsZU1vZGVzWyh0aGlzIGFzIFdvcmtzcGFjZUxlYWYgJiB7IGlkPzogc3RyaW5nIH0pLmlkIHx8IGZpbGVQYXRoXSAhPT0gJ21hcmtkb3duJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNhY2hlID0gc2VsZi5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShmaWxlUGF0aCk7XG5cbiAgICAgICAgICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlciAmJiBjYWNoZS5mcm9udG1hdHRlcltmcm9udG1hdHRlcktleV0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxuICAgICAgICAgICAgICAgICAgdHlwZTogc3dpbWxhbmVLYW5iYW5WaWV3VHlwZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNlbGYuc3dpbWxhbmVLYW5iYW5GaWxlTW9kZXNbZmlsZVBhdGhdID0gc3dpbWxhbmVLYW5iYW5WaWV3VHlwZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dC5hcHBseSh0aGlzLCBbbmV3U3RhdGUsIC4uLnJlc3RdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5leHQuYXBwbHkodGhpcywgW3N0YXRlLCAuLi5yZXN0XSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxufVxuIl19