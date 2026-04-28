import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { MarkdownRenderer, Menu, Notice } from 'obsidian';
import { useContext, useEffect, useMemo, useRef, useState } from 'preact/compat';
import { Droppable } from '../dnd/components/Droppable';
import { ScrollContainer } from '../dnd/components/ScrollContainer';
import { Sortable } from '../dnd/components/Sortable';
import { SortPlaceholder } from '../dnd/components/SortPlaceholder';
import { updateEntity, getEntityFromPath } from '../dnd/util/data';
import { ColumnTemplate, DataTypes, generateInstanceId } from '../types';
import { Column } from './Column';
import { InputModal, TextareaModal } from './InputModal';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';
const COLUMN_TRIGGER_TYPES = [DataTypes.Column];
export function Swimlane({ swimlane, swimlaneIndex }) {
    var _a;
    const { boardModifiers, stateManager, view } = useContext(SwimlaneKanbanContext);
    const [collapsed, setCollapsed] = useState(true);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editDesc, setEditDesc] = useState(swimlane.data.description || '');
    const elementRef = useRef(null);
    const measureRef = useRef(null);
    const descriptionRef = useRef(null);
    const textareaRef = useRef(null);
    // Wikilink suggest state
    const [wlSuggestions, setWlSuggestions] = useState([]);
    const [wlIndex, setWlIndex] = useState(0);
    // Keep editDesc in sync with external state changes
    useEffect(() => {
        if (!isEditingDesc) {
            setEditDesc(swimlane.data.description || '');
        }
    }, [swimlane.data.description]);
    // Render markdown description using Obsidian's renderer (handles [[wikilinks]])
    useEffect(() => {
        var _a;
        if (isEditingDesc || !descriptionRef.current)
            return;
        descriptionRef.current.empty();
        const desc = swimlane.data.description;
        if (desc) {
            MarkdownRenderer.render(stateManager.app, desc, descriptionRef.current, ((_a = view === null || view === void 0 ? void 0 : view.file) === null || _a === void 0 ? void 0 : _a.path) || '', view);
        }
    }, [swimlane.data.description, isEditingDesc]);
    // Handle clicks on internal links rendered by MarkdownRenderer
    useEffect(() => {
        const el = descriptionRef.current;
        if (!el)
            return;
        const handleClick = (e) => {
            var _a;
            const anchor = e.target.closest('a.internal-link');
            if (!anchor)
                return;
            e.preventDefault();
            e.stopPropagation();
            const href = anchor.dataset.href || anchor.getAttribute('href') || '';
            if (href)
                stateManager.app.workspace.openLinkText(href, ((_a = view === null || view === void 0 ? void 0 : view.file) === null || _a === void 0 ? void 0 : _a.path) || '', false);
        };
        el.addEventListener('click', handleClick);
        return () => el.removeEventListener('click', handleClick);
    }, []);
    // Auto-focus textarea when editing starts
    useEffect(() => {
        if (isEditingDesc && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.setProperty('height', 'auto');
            textareaRef.current.style.setProperty('height', textareaRef.current.scrollHeight + 'px');
        }
    }, [isEditingDesc]);
    const saveDescription = () => {
        setIsEditingDesc(false);
        setWlSuggestions([]);
        const trimmed = editDesc.trim();
        if (trimmed !== (swimlane.data.description || '')) {
            stateManager.setState((board) => updateEntity(board, [swimlaneIndex], {
                data: { $merge: { description: trimmed || undefined } },
            }));
        }
    };
    // Detect [[query at cursor and update suggestions
    const updateWlSuggestions = (ta) => {
        var _a;
        const pos = (_a = ta.selectionStart) !== null && _a !== void 0 ? _a : ta.value.length;
        const before = ta.value.slice(0, pos);
        const match = before.match(/\[\[([^\][\n|]*)$/);
        if (match) {
            const query = match[1].toLowerCase();
            const files = stateManager.app.vault.getMarkdownFiles();
            const filtered = files
                .filter(f => f.basename.toLowerCase().includes(query))
                .sort((a, b) => {
                // Exact prefix matches first
                const aStarts = a.basename.toLowerCase().startsWith(query);
                const bStarts = b.basename.toLowerCase().startsWith(query);
                if (aStarts && !bStarts)
                    return -1;
                if (!aStarts && bStarts)
                    return 1;
                return a.basename.localeCompare(b.basename);
            })
                .slice(0, 8);
            setWlSuggestions(filtered);
            setWlIndex(0);
        }
        else {
            setWlSuggestions([]);
        }
    };
    // Insert selected file as a wikilink, replacing the [[query at cursor
    const selectWlSuggestion = (file) => {
        var _a;
        const ta = textareaRef.current;
        if (!ta)
            return;
        const pos = (_a = ta.selectionStart) !== null && _a !== void 0 ? _a : ta.value.length;
        const before = ta.value.slice(0, pos);
        const match = before.match(/\[\[([^\][\n|]*)$/);
        if (!match)
            return;
        const linkStart = pos - match[0].length; // position of the opening [[
        const newVal = ta.value.slice(0, linkStart) +
            '[[' + file.basename + ']]' +
            ta.value.slice(pos);
        setEditDesc(newVal);
        setWlSuggestions([]);
        const newCursor = linkStart + 2 + file.basename.length + 2;
        requestAnimationFrame(() => {
            const t = textareaRef.current;
            if (!t)
                return;
            t.focus();
            t.setSelectionRange(newCursor, newCursor);
            t.style.setProperty('height', 'auto');
            t.style.setProperty('height', t.scrollHeight + 'px');
        });
    };
    const hasAnyCards = swimlane.children.some(col => col.children.length > 0);
    const [clearedSnapshot, setClearedSnapshot] = useState([]);
    const handleClear = () => {
        const snapshot = swimlane.children
            .map((col, colIndex) => ({ colIndex, items: col.children }))
            .filter(({ items }) => items.length > 0);
        setClearedSnapshot(snapshot);
        stateManager.setState((board) => {
            let updated = board;
            snapshot.forEach(({ colIndex }) => {
                updated = updateEntity(updated, [swimlaneIndex, colIndex], { children: { $set: [] } });
            });
            return updated;
        });
    };
    const handleUnclear = () => {
        stateManager.setState((board) => {
            let updated = board;
            clearedSnapshot.forEach(({ colIndex, items }) => {
                updated = updateEntity(updated, [swimlaneIndex, colIndex], { children: { $set: items } });
            });
            return updated;
        });
        setClearedSnapshot([]);
    };
    const handleReload = () => {
        const scaffold = swimlane.data.scaffold;
        if (!scaffold || scaffold.length === 0 || swimlane.children.length === 0)
            return;
        const summary = `Reloading ${scaffold.length} task${scaffold.length !== 1 ? 's' : ''} into "${swimlane.children[0].data.title}":\n` +
            scaffold.map((t) => `• ${t}`).join('\n');
        new Notice(summary, 5000);
        const priorityRe = /\s*\[priority::([^\]]+)\]/;
        const newItems = scaffold.map((raw) => {
            let title = raw;
            let priority;
            const m = title.match(priorityRe);
            if (m) {
                priority = m[1].trim();
                title = title.replace(priorityRe, '').trim();
            }
            return {
                id: generateInstanceId(),
                type: DataTypes.Item,
                accepts: [DataTypes.Item],
                children: [],
                data: { title, checked: false, priority },
            };
        });
        stateManager.setState((board) => updateEntity(board, [swimlaneIndex, 0], {
            children: { $push: newItems },
        }));
    };
    const handleDescInput = (e) => {
        const ta = e.target;
        ta.style.setProperty('height', 'auto');
        ta.style.setProperty('height', ta.scrollHeight + 'px');
        setEditDesc(ta.value);
        updateWlSuggestions(ta);
    };
    const handleDescKeyDown = (e) => {
        // Wikilink suggest navigation takes priority
        if (wlSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setWlIndex(i => Math.min(i + 1, wlSuggestions.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setWlIndex(i => Math.max(i - 1, 0));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                selectWlSuggestion(wlSuggestions[wlIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setWlSuggestions([]);
                return;
            }
        }
        if (e.key === 'Escape') {
            setEditDesc(swimlane.data.description || '');
            setIsEditingDesc(false);
        }
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            saveDescription();
        }
    };
    const data = useMemo(() => {
        var _a;
        return ({
            id: swimlane.id,
            type: DataTypes.Swimlane,
            accepts: [],
            win: ((_a = view === null || view === void 0 ? void 0 : view.getWindow) === null || _a === void 0 ? void 0 : _a.call(view)) || window,
        });
    }, [swimlane.id]);
    const handleContextMenu = (e) => {
        e.preventDefault();
        const menu = new Menu();
        const totalSwimlanes = stateManager.state.children.length;
        if (swimlaneIndex > 0) {
            menu.addItem((item) => {
                item
                    .setTitle('Move up')
                    .setIcon('lucide-arrow-up')
                    .onClick(() => boardModifiers.moveSwimlane(swimlaneIndex, swimlaneIndex - 1));
            });
        }
        if (swimlaneIndex < totalSwimlanes - 1) {
            menu.addItem((item) => {
                item
                    .setTitle('Move down')
                    .setIcon('lucide-arrow-down')
                    .onClick(() => boardModifiers.moveSwimlane(swimlaneIndex, swimlaneIndex + 1));
            });
        }
        menu.addItem((item) => {
            item
                .setTitle('Add column...')
                .setIcon('lucide-plus')
                .onClick(() => {
                const modal = new InputModal(stateManager.app, 'Column name:', '', (title) => {
                    if (!(title === null || title === void 0 ? void 0 : title.trim()))
                        return;
                    const defaultWip = stateManager.getSetting('default-wip');
                    const column = {
                        ...ColumnTemplate,
                        id: generateInstanceId(),
                        children: [],
                        data: { title: title.trim(), wipLimit: defaultWip },
                    };
                    boardModifiers.addColumn([swimlaneIndex], column);
                });
                modal.open();
            });
        });
        menu.addItem((item) => {
            item
                .setTitle('Rename swimlane...')
                .setIcon('lucide-edit')
                .onClick(() => {
                const modal = new InputModal(stateManager.app, 'Swimlane name:', swimlane.data.title, (newTitle) => {
                    if (!(newTitle === null || newTitle === void 0 ? void 0 : newTitle.trim()))
                        return;
                    stateManager.setState((board) => updateEntity(board, [swimlaneIndex], {
                        data: { $merge: { title: newTitle.trim() } },
                    }));
                });
                modal.open();
            });
        });
        const colourOptions = [
            { name: 'blue', icon: 'lucide-circle' },
            { name: 'green', icon: 'lucide-circle' },
            { name: 'red', icon: 'lucide-circle' },
            { name: 'orange', icon: 'lucide-circle' },
            { name: 'purple', icon: 'lucide-circle' },
            { name: 'pink', icon: 'lucide-circle' },
            { name: 'cyan', icon: 'lucide-circle' },
            { name: 'gold', icon: 'lucide-circle' },
            { name: 'amber', icon: 'lucide-circle' },
            { name: 'jade', icon: 'lucide-circle' },
            { name: 'bronze', icon: 'lucide-circle' },
            { name: 'scarlet', icon: 'lucide-circle' },
            { name: 'teal', icon: 'lucide-circle' },
        ];
        const setColour = (color) => {
            stateManager.setState((board) => updateEntity(board, [swimlaneIndex], {
                data: { $merge: { color } },
            }));
        };
        menu.addItem((item) => {
            // @ts-expect-error undocumented Obsidian API: MenuItem.setSubmenu
            const sub = item.setSubmenu();
            item.setTitle('Set colour').setIcon('lucide-palette');
            for (const opt of colourOptions) {
                sub.addItem((si) => {
                    const label = swimlane.data.color === opt.name
                        ? `● ${opt.name}`
                        : `○ ${opt.name}`;
                    si.setTitle(label).setIcon(opt.icon).onClick(() => setColour(opt.name));
                });
            }
            sub.addSeparator();
            sub.addItem((si) => {
                si.setTitle('Clear colour').setIcon('lucide-x-circle').onClick(() => setColour(undefined));
            });
        });
        menu.addItem((item) => {
            item
                .setTitle('Edit scaffold...')
                .setIcon('lucide-list')
                .onClick(() => {
                const current = (swimlane.data.scaffold || []).join('\n');
                const modal = new TextareaModal(stateManager.app, 'Scaffold tasks (one per line):', current, (val) => {
                    if (val === null)
                        return;
                    const tasks = val.split('\n').map(t => t.trim()).filter(t => t.length > 0);
                    stateManager.setState((board) => updateEntity(board, [swimlaneIndex], {
                        data: { $merge: { scaffold: tasks.length > 0 ? tasks : undefined } },
                    }));
                }, {
                    placeholder: 'Standup [priority::P0]\nCode review [priority::P1]\nWeekly report',
                    hint: 'Add [priority::X] to set a priority, e.g. P0, P1, high, low',
                });
                modal.open();
            });
        });
        menu.addItem((item) => {
            item
                .setTitle('Clear all cards')
                .setIcon('lucide-eraser')
                .onClick(() => {
                stateManager.setState((board) => {
                    const swimlane = getEntityFromPath(board, [swimlaneIndex]);
                    let updated = board;
                    swimlane.children.forEach((_, colIndex) => {
                        updated = updateEntity(updated, [swimlaneIndex, colIndex], { children: { $set: [] } });
                    });
                    return updated;
                });
            });
        });
        menu.addItem((item) => {
            item
                .setTitle('Demote to card')
                .setIcon('lucide-arrow-down-to-line')
                .onClick(() => {
                boardModifiers.demoteToCard(swimlaneIndex);
            });
        });
        menu.addItem((item) => {
            item
                .setTitle('Delete swimlane')
                .setIcon('lucide-trash')
                .onClick(() => {
                boardModifiers.deleteEntity([swimlaneIndex]);
            });
        });
        menu.showAtMouseEvent(e);
    };
    const CUSTOM_COLORS = {
        gold: '#E8C84A',
        amber: '#D4920A',
        jade: '#3D7A5E',
        bronze: '#A07830',
        scarlet: '#CC1111',
        teal: '#2A8A8A',
    };
    const accentStyle = swimlane.data.color
        ? {
            '--swimlane-accent': swimlane.data.color.startsWith('#')
                ? swimlane.data.color
                : CUSTOM_COLORS[swimlane.data.color]
                    ? CUSTOM_COLORS[swimlane.data.color]
                    : `var(--color-${swimlane.data.color})`,
        }
        : undefined;
    return (_jsx("div", { ref: measureRef, className: c('swimlane'), style: accentStyle, children: _jsx(Droppable, { elementRef: elementRef, measureRef: measureRef, id: swimlane.id, index: swimlaneIndex, data: data, children: _jsxs("div", { ref: elementRef, children: [_jsxs("div", { className: c('swimlane-header'), onContextMenu: handleContextMenu, children: [_jsx("button", { className: c('swimlane-collapse') + (collapsed ? ` ${c('swimlane-collapse--collapsed')}` : ''), onClick: () => setCollapsed(!collapsed), title: collapsed ? 'Expand' : 'Collapse' }), _jsx("span", { className: c('swimlane-title'), children: swimlane.data.title }), swimlane.data.scaffold && swimlane.data.scaffold.length > 0 && (_jsx("button", { className: c('swimlane-reload'), onClick: handleReload, title: `Reload into "${(_a = swimlane.children[0]) === null || _a === void 0 ? void 0 : _a.data.title}":\n${swimlane.data.scaffold.map(t => `• ${t}`).join('\n')}`, "data-ignore-drag": true, children: "RELOAD" })), hasAnyCards && (_jsx("button", { className: c('swimlane-clear'), onClick: handleClear, title: "Clear all cards from this swimlane", "data-ignore-drag": true, children: "CLEAR" })), clearedSnapshot.length > 0 && (_jsx("button", { className: c('swimlane-unclear'), onClick: handleUnclear, title: "Undo clear and restore all cards", "data-ignore-drag": true, children: "UNCLEAR" })), _jsxs("span", { className: c('swimlane-count'), children: [swimlane.children.reduce((sum, col) => sum + col.children.length, 0), " cards"] })] }), _jsx("div", { className: c('swimlane-description-wrap'), children: isEditingDesc ? (_jsxs("div", { className: c('swimlane-desc-editor-wrap'), children: [_jsx("textarea", { ref: textareaRef, className: c('swimlane-description-editor'), value: editDesc, onInput: handleDescInput, onBlur: saveDescription, onKeyDown: handleDescKeyDown, placeholder: "Describe the flow of this swimlane... (supports [[wiki links]])", rows: 2 }), wlSuggestions.length > 0 && (_jsx("div", { className: c('wl-suggest'), children: wlSuggestions.map((file, i) => {
                                        var _a, _b;
                                        return (_jsxs("div", { className: c('wl-suggest-item') +
                                                (i === wlIndex ? ' ' + c('wl-suggest-item--active') : ''), onMouseDown: (e) => {
                                                e.preventDefault(); // prevent textarea blur
                                                selectWlSuggestion(file);
                                            }, children: [_jsx("span", { className: c('wl-suggest-icon'), children: "\u27E6\u27E7" }), _jsx("span", { className: c('wl-suggest-name'), children: file.basename }), _jsx("span", { className: c('wl-suggest-path'), children: ((_a = file.parent) === null || _a === void 0 ? void 0 : _a.path) !== '/' ? (_b = file.parent) === null || _b === void 0 ? void 0 : _b.path : '' })] }, file.path));
                                    }) }))] })) : (_jsx("div", { className: c('swimlane-description') + (swimlane.data.description ? '' : ' ' + c('swimlane-description--empty')), ref: descriptionRef, onClick: () => setIsEditingDesc(true), title: "Click to edit description", children: !swimlane.data.description && (_jsx("span", { className: c('swimlane-description-placeholder'), children: "Describe the flow of this swimlane..." })) })) }), !collapsed && (_jsx(Sortable, { axis: "horizontal", children: _jsxs(ScrollContainer, { id: swimlane.id, className: c('swimlane-columns'), triggerTypes: COLUMN_TRIGGER_TYPES, children: [swimlane.children.map((column, i) => (_jsx(Column, { column: column, columnIndex: i, swimlaneIndex: swimlaneIndex }, column.id))), _jsx(SortPlaceholder, { index: swimlane.children.length, accepts: [DataTypes.Column], className: c('sort-placeholder') })] }) }))] }) }) }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3dpbWxhbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTd2ltbGFuZS50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQVksTUFBTSxFQUFTLE1BQU0sVUFBVSxDQUFDO0FBRTNFLE9BQU8sRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRWpGLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFDcEUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUNwRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFbkUsT0FBTyxFQUFzQixjQUFjLEVBQUUsU0FBUyxFQUFrQyxrQkFBa0IsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUM3SCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3pELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNsRCxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRTlCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFPaEQsTUFBTSxVQUFVLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQWlCOztJQUNqRSxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUNq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QUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1hcmtkb3duUmVuZGVyZXIsIE1lbnUsIE1lbnVJdGVtLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgSlNYIH0gZnJvbSAncHJlYWN0JztcbmltcG9ydCB7IHVzZUNvbnRleHQsIHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3ByZWFjdC9jb21wYXQnO1xuXG5pbXBvcnQgeyBEcm9wcGFibGUgfSBmcm9tICcuLi9kbmQvY29tcG9uZW50cy9Ecm9wcGFibGUnO1xuaW1wb3J0IHsgU2Nyb2xsQ29udGFpbmVyIH0gZnJvbSAnLi4vZG5kL2NvbXBvbmVudHMvU2Nyb2xsQ29udGFpbmVyJztcbmltcG9ydCB7IFNvcnRhYmxlIH0gZnJvbSAnLi4vZG5kL2NvbXBvbmVudHMvU29ydGFibGUnO1xuaW1wb3J0IHsgU29ydFBsYWNlaG9sZGVyIH0gZnJvbSAnLi4vZG5kL2NvbXBvbmVudHMvU29ydFBsYWNlaG9sZGVyJztcbmltcG9ydCB7IHVwZGF0ZUVudGl0eSwgZ2V0RW50aXR5RnJvbVBhdGggfSBmcm9tICcuLi9kbmQvdXRpbC9kYXRhJztcbmltcG9ydCB7IEVudGl0eURhdGEgfSBmcm9tICcuLi9kbmQvdHlwZXMnO1xuaW1wb3J0IHsgQm9hcmQgYXMgQm9hcmRUeXBlLCBDb2x1bW5UZW1wbGF0ZSwgRGF0YVR5cGVzLCBJdGVtLCBTd2ltbGFuZSBhcyBTd2ltbGFuZVR5cGUsIGdlbmVyYXRlSW5zdGFuY2VJZCB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IENvbHVtbiB9IGZyb20gJy4vQ29sdW1uJztcbmltcG9ydCB7IElucHV0TW9kYWwsIFRleHRhcmVhTW9kYWwgfSBmcm9tICcuL0lucHV0TW9kYWwnO1xuaW1wb3J0IHsgU3dpbWxhbmVLYW5iYW5Db250ZXh0IH0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7IGMgfSBmcm9tICcuL2hlbHBlcnMnO1xuXG5jb25zdCBDT0xVTU5fVFJJR0dFUl9UWVBFUyA9IFtEYXRhVHlwZXMuQ29sdW1uXTtcblxuaW50ZXJmYWNlIFN3aW1sYW5lUHJvcHMge1xuICBzd2ltbGFuZTogU3dpbWxhbmVUeXBlO1xuICBzd2ltbGFuZUluZGV4OiBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTd2ltbGFuZSh7IHN3aW1sYW5lLCBzd2ltbGFuZUluZGV4IH06IFN3aW1sYW5lUHJvcHMpIHtcbiAgY29uc3QgeyBib2FyZE1vZGlmaWVycywgc3RhdGVNYW5hZ2VyLCB2aWV3IH0gPSB1c2VDb250ZXh0KFN3aW1sYW5lS2FuYmFuQ29udGV4dCk7XG4gIGNvbnN0IFtjb2xsYXBzZWQsIHNldENvbGxhcHNlZF0gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW2lzRWRpdGluZ0Rlc2MsIHNldElzRWRpdGluZ0Rlc2NdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZWRpdERlc2MsIHNldEVkaXREZXNjXSA9IHVzZVN0YXRlKHN3aW1sYW5lLmRhdGEuZGVzY3JpcHRpb24gfHwgJycpO1xuICBjb25zdCBlbGVtZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3QgbWVhc3VyZVJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IGRlc2NyaXB0aW9uUmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3QgdGV4dGFyZWFSZWYgPSB1c2VSZWY8SFRNTFRleHRBcmVhRWxlbWVudD4obnVsbCk7XG5cbiAgLy8gV2lraWxpbmsgc3VnZ2VzdCBzdGF0ZVxuICBjb25zdCBbd2xTdWdnZXN0aW9ucywgc2V0V2xTdWdnZXN0aW9uc10gPSB1c2VTdGF0ZTxURmlsZVtdPihbXSk7XG4gIGNvbnN0IFt3bEluZGV4LCBzZXRXbEluZGV4XSA9IHVzZVN0YXRlKDApO1xuXG4gIC8vIEtlZXAgZWRpdERlc2MgaW4gc3luYyB3aXRoIGV4dGVybmFsIHN0YXRlIGNoYW5nZXNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWlzRWRpdGluZ0Rlc2MpIHtcbiAgICAgIHNldEVkaXREZXNjKHN3aW1sYW5lLmRhdGEuZGVzY3JpcHRpb24gfHwgJycpO1xuICAgIH1cbiAgfSwgW3N3aW1sYW5lLmRhdGEuZGVzY3JpcHRpb25dKTtcblxuICAvLyBSZW5kZXIgbWFya2Rvd24gZGVzY3JpcHRpb24gdXNpbmcgT2JzaWRpYW4ncyByZW5kZXJlciAoaGFuZGxlcyBbW3dpa2lsaW5rc11dKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc0VkaXRpbmdEZXNjIHx8ICFkZXNjcmlwdGlvblJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgZGVzY3JpcHRpb25SZWYuY3VycmVudC5lbXB0eSgpO1xuICAgIGNvbnN0IGRlc2MgPSBzd2ltbGFuZS5kYXRhLmRlc2NyaXB0aW9uO1xuICAgIGlmIChkZXNjKSB7XG4gICAgICBNYXJrZG93blJlbmRlcmVyLnJlbmRlcihcbiAgICAgICAgc3RhdGVNYW5hZ2VyLmFwcCxcbiAgICAgICAgZGVzYyxcbiAgICAgICAgZGVzY3JpcHRpb25SZWYuY3VycmVudCxcbiAgICAgICAgdmlldz8uZmlsZT8ucGF0aCB8fCAnJyxcbiAgICAgICAgdmlld1xuICAgICAgKTtcbiAgICB9XG4gIH0sIFtzd2ltbGFuZS5kYXRhLmRlc2NyaXB0aW9uLCBpc0VkaXRpbmdEZXNjXSk7XG5cbiAgLy8gSGFuZGxlIGNsaWNrcyBvbiBpbnRlcm5hbCBsaW5rcyByZW5kZXJlZCBieSBNYXJrZG93blJlbmRlcmVyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZWwgPSBkZXNjcmlwdGlvblJlZi5jdXJyZW50O1xuICAgIGlmICghZWwpIHJldHVybjtcbiAgICBjb25zdCBoYW5kbGVDbGljayA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBhbmNob3IgPSAoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsb3Nlc3QoJ2EuaW50ZXJuYWwtbGluaycpIGFzIEhUTUxBbmNob3JFbGVtZW50IHwgbnVsbDtcbiAgICAgIGlmICghYW5jaG9yKSByZXR1cm47XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgY29uc3QgaHJlZiA9IGFuY2hvci5kYXRhc2V0LmhyZWYgfHwgYW5jaG9yLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xuICAgICAgaWYgKGhyZWYpIHN0YXRlTWFuYWdlci5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChocmVmLCB2aWV3Py5maWxlPy5wYXRoIHx8ICcnLCBmYWxzZSk7XG4gICAgfTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUNsaWNrKTtcbiAgICByZXR1cm4gKCkgPT4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVDbGljayk7XG4gIH0sIFtdKTtcblxuICAvLyBBdXRvLWZvY3VzIHRleHRhcmVhIHdoZW4gZWRpdGluZyBzdGFydHNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXNFZGl0aW5nRGVzYyAmJiB0ZXh0YXJlYVJlZi5jdXJyZW50KSB7XG4gICAgICB0ZXh0YXJlYVJlZi5jdXJyZW50LmZvY3VzKCk7XG4gICAgICB0ZXh0YXJlYVJlZi5jdXJyZW50LnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgdGV4dGFyZWFSZWYuY3VycmVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgdGV4dGFyZWFSZWYuY3VycmVudC5zY3JvbGxIZWlnaHQgKyAncHgnKTtcbiAgICB9XG4gIH0sIFtpc0VkaXRpbmdEZXNjXSk7XG5cbiAgY29uc3Qgc2F2ZURlc2NyaXB0aW9uID0gKCkgPT4ge1xuICAgIHNldElzRWRpdGluZ0Rlc2MoZmFsc2UpO1xuICAgIHNldFdsU3VnZ2VzdGlvbnMoW10pO1xuICAgIGNvbnN0IHRyaW1tZWQgPSBlZGl0RGVzYy50cmltKCk7XG4gICAgaWYgKHRyaW1tZWQgIT09IChzd2ltbGFuZS5kYXRhLmRlc2NyaXB0aW9uIHx8ICcnKSkge1xuICAgICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZDogQm9hcmRUeXBlKSA9PlxuICAgICAgICB1cGRhdGVFbnRpdHkoYm9hcmQsIFtzd2ltbGFuZUluZGV4XSwge1xuICAgICAgICAgIGRhdGE6IHsgJG1lcmdlOiB7IGRlc2NyaXB0aW9uOiB0cmltbWVkIHx8IHVuZGVmaW5lZCB9IH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICAvLyBEZXRlY3QgW1txdWVyeSBhdCBjdXJzb3IgYW5kIHVwZGF0ZSBzdWdnZXN0aW9uc1xuICBjb25zdCB1cGRhdGVXbFN1Z2dlc3Rpb25zID0gKHRhOiBIVE1MVGV4dEFyZWFFbGVtZW50KSA9PiB7XG4gICAgY29uc3QgcG9zID0gdGEuc2VsZWN0aW9uU3RhcnQgPz8gdGEudmFsdWUubGVuZ3RoO1xuICAgIGNvbnN0IGJlZm9yZSA9IHRhLnZhbHVlLnNsaWNlKDAsIHBvcyk7XG4gICAgY29uc3QgbWF0Y2ggPSBiZWZvcmUubWF0Y2goL1xcW1xcWyhbXlxcXVtcXG58XSopJC8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgY29uc3QgcXVlcnkgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgZmlsZXMgPSBzdGF0ZU1hbmFnZXIuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXNcbiAgICAgICAgLmZpbHRlcihmID0+IGYuYmFzZW5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSkpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgLy8gRXhhY3QgcHJlZml4IG1hdGNoZXMgZmlyc3RcbiAgICAgICAgICBjb25zdCBhU3RhcnRzID0gYS5iYXNlbmFtZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgocXVlcnkpO1xuICAgICAgICAgIGNvbnN0IGJTdGFydHMgPSBiLmJhc2VuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChxdWVyeSk7XG4gICAgICAgICAgaWYgKGFTdGFydHMgJiYgIWJTdGFydHMpIHJldHVybiAtMTtcbiAgICAgICAgICBpZiAoIWFTdGFydHMgJiYgYlN0YXJ0cykgcmV0dXJuIDE7XG4gICAgICAgICAgcmV0dXJuIGEuYmFzZW5hbWUubG9jYWxlQ29tcGFyZShiLmJhc2VuYW1lKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnNsaWNlKDAsIDgpO1xuICAgICAgc2V0V2xTdWdnZXN0aW9ucyhmaWx0ZXJlZCk7XG4gICAgICBzZXRXbEluZGV4KDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRXbFN1Z2dlc3Rpb25zKFtdKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gSW5zZXJ0IHNlbGVjdGVkIGZpbGUgYXMgYSB3aWtpbGluaywgcmVwbGFjaW5nIHRoZSBbW3F1ZXJ5IGF0IGN1cnNvclxuICBjb25zdCBzZWxlY3RXbFN1Z2dlc3Rpb24gPSAoZmlsZTogVEZpbGUpID0+IHtcbiAgICBjb25zdCB0YSA9IHRleHRhcmVhUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCF0YSkgcmV0dXJuO1xuXG4gICAgY29uc3QgcG9zID0gdGEuc2VsZWN0aW9uU3RhcnQgPz8gdGEudmFsdWUubGVuZ3RoO1xuICAgIGNvbnN0IGJlZm9yZSA9IHRhLnZhbHVlLnNsaWNlKDAsIHBvcyk7XG4gICAgY29uc3QgbWF0Y2ggPSBiZWZvcmUubWF0Y2goL1xcW1xcWyhbXlxcXVtcXG58XSopJC8pO1xuICAgIGlmICghbWF0Y2gpIHJldHVybjtcblxuICAgIGNvbnN0IGxpbmtTdGFydCA9IHBvcyAtIG1hdGNoWzBdLmxlbmd0aDsgLy8gcG9zaXRpb24gb2YgdGhlIG9wZW5pbmcgW1tcbiAgICBjb25zdCBuZXdWYWwgPVxuICAgICAgdGEudmFsdWUuc2xpY2UoMCwgbGlua1N0YXJ0KSArXG4gICAgICAnW1snICsgZmlsZS5iYXNlbmFtZSArICddXScgK1xuICAgICAgdGEudmFsdWUuc2xpY2UocG9zKTtcblxuICAgIHNldEVkaXREZXNjKG5ld1ZhbCk7XG4gICAgc2V0V2xTdWdnZXN0aW9ucyhbXSk7XG5cbiAgICBjb25zdCBuZXdDdXJzb3IgPSBsaW5rU3RhcnQgKyAyICsgZmlsZS5iYXNlbmFtZS5sZW5ndGggKyAyO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICBjb25zdCB0ID0gdGV4dGFyZWFSZWYuY3VycmVudDtcbiAgICAgIGlmICghdCkgcmV0dXJuO1xuICAgICAgdC5mb2N1cygpO1xuICAgICAgdC5zZXRTZWxlY3Rpb25SYW5nZShuZXdDdXJzb3IsIG5ld0N1cnNvcik7XG4gICAgICB0LnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgdC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgdC5zY3JvbGxIZWlnaHQgKyAncHgnKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb25zdCBoYXNBbnlDYXJkcyA9IHN3aW1sYW5lLmNoaWxkcmVuLnNvbWUoY29sID0+IGNvbC5jaGlsZHJlbi5sZW5ndGggPiAwKTtcbiAgY29uc3QgW2NsZWFyZWRTbmFwc2hvdCwgc2V0Q2xlYXJlZFNuYXBzaG90XSA9IHVzZVN0YXRlPHsgY29sSW5kZXg6IG51bWJlcjsgaXRlbXM6IEl0ZW1bXSB9W10+KFtdKTtcblxuICBjb25zdCBoYW5kbGVDbGVhciA9ICgpID0+IHtcbiAgICBjb25zdCBzbmFwc2hvdCA9IHN3aW1sYW5lLmNoaWxkcmVuXG4gICAgICAubWFwKChjb2wsIGNvbEluZGV4KSA9PiAoeyBjb2xJbmRleCwgaXRlbXM6IGNvbC5jaGlsZHJlbiB9KSlcbiAgICAgIC5maWx0ZXIoKHsgaXRlbXMgfSkgPT4gaXRlbXMubGVuZ3RoID4gMCk7XG4gICAgc2V0Q2xlYXJlZFNuYXBzaG90KHNuYXBzaG90KTtcbiAgICBzdGF0ZU1hbmFnZXIuc2V0U3RhdGUoKGJvYXJkOiBCb2FyZFR5cGUpID0+IHtcbiAgICAgIGxldCB1cGRhdGVkID0gYm9hcmQ7XG4gICAgICBzbmFwc2hvdC5mb3JFYWNoKCh7IGNvbEluZGV4IH0pID0+IHtcbiAgICAgICAgdXBkYXRlZCA9IHVwZGF0ZUVudGl0eSh1cGRhdGVkLCBbc3dpbWxhbmVJbmRleCwgY29sSW5kZXhdLCB7IGNoaWxkcmVuOiB7ICRzZXQ6IFtdIH0gfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVVuY2xlYXIgPSAoKSA9PiB7XG4gICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZDogQm9hcmRUeXBlKSA9PiB7XG4gICAgICBsZXQgdXBkYXRlZCA9IGJvYXJkO1xuICAgICAgY2xlYXJlZFNuYXBzaG90LmZvckVhY2goKHsgY29sSW5kZXgsIGl0ZW1zIH0pID0+IHtcbiAgICAgICAgdXBkYXRlZCA9IHVwZGF0ZUVudGl0eSh1cGRhdGVkLCBbc3dpbWxhbmVJbmRleCwgY29sSW5kZXhdLCB7IGNoaWxkcmVuOiB7ICRzZXQ6IGl0ZW1zIH0gfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgIH0pO1xuICAgIHNldENsZWFyZWRTbmFwc2hvdChbXSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlUmVsb2FkID0gKCkgPT4ge1xuICAgIGNvbnN0IHNjYWZmb2xkID0gc3dpbWxhbmUuZGF0YS5zY2FmZm9sZDtcbiAgICBpZiAoIXNjYWZmb2xkIHx8IHNjYWZmb2xkLmxlbmd0aCA9PT0gMCB8fCBzd2ltbGFuZS5jaGlsZHJlbi5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHN1bW1hcnkgPSBgUmVsb2FkaW5nICR7c2NhZmZvbGQubGVuZ3RofSB0YXNrJHtzY2FmZm9sZC5sZW5ndGggIT09IDEgPyAncycgOiAnJ30gaW50byBcIiR7c3dpbWxhbmUuY2hpbGRyZW5bMF0uZGF0YS50aXRsZX1cIjpcXG5gICtcbiAgICAgIHNjYWZmb2xkLm1hcCgodCkgPT4gYOKAoiAke3R9YCkuam9pbignXFxuJyk7XG4gICAgbmV3IE5vdGljZShzdW1tYXJ5LCA1MDAwKTtcblxuICAgIGNvbnN0IHByaW9yaXR5UmUgPSAvXFxzKlxcW3ByaW9yaXR5OjooW15cXF1dKylcXF0vO1xuICAgIGNvbnN0IG5ld0l0ZW1zID0gc2NhZmZvbGQubWFwKChyYXcpID0+IHtcbiAgICAgIGxldCB0aXRsZSA9IHJhdztcbiAgICAgIGxldCBwcmlvcml0eTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3QgbSA9IHRpdGxlLm1hdGNoKHByaW9yaXR5UmUpO1xuICAgICAgaWYgKG0pIHtcbiAgICAgICAgcHJpb3JpdHkgPSBtWzFdLnRyaW0oKTtcbiAgICAgICAgdGl0bGUgPSB0aXRsZS5yZXBsYWNlKHByaW9yaXR5UmUsICcnKS50cmltKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogZ2VuZXJhdGVJbnN0YW5jZUlkKCksXG4gICAgICAgIHR5cGU6IERhdGFUeXBlcy5JdGVtLFxuICAgICAgICBhY2NlcHRzOiBbRGF0YVR5cGVzLkl0ZW1dLFxuICAgICAgICBjaGlsZHJlbjogW10gYXMgSXRlbVtdLFxuICAgICAgICBkYXRhOiB7IHRpdGxlLCBjaGVja2VkOiBmYWxzZSwgcHJpb3JpdHkgfSxcbiAgICAgIH07XG4gICAgfSk7XG4gICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZDogQm9hcmRUeXBlKSA9PlxuICAgICAgdXBkYXRlRW50aXR5KGJvYXJkLCBbc3dpbWxhbmVJbmRleCwgMF0sIHtcbiAgICAgICAgY2hpbGRyZW46IHsgJHB1c2g6IG5ld0l0ZW1zIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRGVzY0lucHV0ID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgY29uc3QgdGEgPSBlLnRhcmdldCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICAgIHRhLnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCAnYXV0bycpO1xuICAgIHRhLnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCB0YS5zY3JvbGxIZWlnaHQgKyAncHgnKTtcbiAgICBzZXRFZGl0RGVzYyh0YS52YWx1ZSk7XG4gICAgdXBkYXRlV2xTdWdnZXN0aW9ucyh0YSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRGVzY0tleURvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIC8vIFdpa2lsaW5rIHN1Z2dlc3QgbmF2aWdhdGlvbiB0YWtlcyBwcmlvcml0eVxuICAgIGlmICh3bFN1Z2dlc3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0Fycm93RG93bicpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzZXRXbEluZGV4KGkgPT4gTWF0aC5taW4oaSArIDEsIHdsU3VnZ2VzdGlvbnMubGVuZ3RoIC0gMSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZS5rZXkgPT09ICdBcnJvd1VwJykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNldFdsSW5kZXgoaSA9PiBNYXRoLm1heChpIC0gMSwgMCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzZWxlY3RXbFN1Z2dlc3Rpb24od2xTdWdnZXN0aW9uc1t3bEluZGV4XSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgICAgc2V0V2xTdWdnZXN0aW9ucyhbXSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICBzZXRFZGl0RGVzYyhzd2ltbGFuZS5kYXRhLmRlc2NyaXB0aW9uIHx8ICcnKTtcbiAgICAgIHNldElzRWRpdGluZ0Rlc2MoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKSB7XG4gICAgICBzYXZlRGVzY3JpcHRpb24oKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgZGF0YSA9IHVzZU1lbW88RW50aXR5RGF0YT4oXG4gICAgKCkgPT4gKHtcbiAgICAgIGlkOiBzd2ltbGFuZS5pZCxcbiAgICAgIHR5cGU6IERhdGFUeXBlcy5Td2ltbGFuZSxcbiAgICAgIGFjY2VwdHM6IFtdLFxuICAgICAgd2luOiB2aWV3Py5nZXRXaW5kb3c/LigpIHx8IHdpbmRvdyxcbiAgICB9KSxcbiAgICBbc3dpbWxhbmUuaWRdXG4gICk7XG5cbiAgY29uc3QgaGFuZGxlQ29udGV4dE1lbnUgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcbiAgICBjb25zdCB0b3RhbFN3aW1sYW5lcyA9IHN0YXRlTWFuYWdlci5zdGF0ZS5jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICBpZiAoc3dpbWxhbmVJbmRleCA+IDApIHtcbiAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtXG4gICAgICAgICAgLnNldFRpdGxlKCdNb3ZlIHVwJylcbiAgICAgICAgICAuc2V0SWNvbignbHVjaWRlLWFycm93LXVwJylcbiAgICAgICAgICAub25DbGljaygoKSA9PiBib2FyZE1vZGlmaWVycy5tb3ZlU3dpbWxhbmUoc3dpbWxhbmVJbmRleCwgc3dpbWxhbmVJbmRleCAtIDEpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChzd2ltbGFuZUluZGV4IDwgdG90YWxTd2ltbGFuZXMgLSAxKSB7XG4gICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgICAgaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZSgnTW92ZSBkb3duJylcbiAgICAgICAgICAuc2V0SWNvbignbHVjaWRlLWFycm93LWRvd24nKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IGJvYXJkTW9kaWZpZXJzLm1vdmVTd2ltbGFuZShzd2ltbGFuZUluZGV4LCBzd2ltbGFuZUluZGV4ICsgMSkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZSgnQWRkIGNvbHVtbi4uLicpXG4gICAgICAgIC5zZXRJY29uKCdsdWNpZGUtcGx1cycpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBtb2RhbCA9IG5ldyBJbnB1dE1vZGFsKFxuICAgICAgICAgICAgc3RhdGVNYW5hZ2VyLmFwcCxcbiAgICAgICAgICAgICdDb2x1bW4gbmFtZTonLFxuICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAodGl0bGUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCF0aXRsZT8udHJpbSgpKSByZXR1cm47XG4gICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRXaXAgPSBzdGF0ZU1hbmFnZXIuZ2V0U2V0dGluZygnZGVmYXVsdC13aXAnKTtcbiAgICAgICAgICAgICAgY29uc3QgY29sdW1uID0ge1xuICAgICAgICAgICAgICAgIC4uLkNvbHVtblRlbXBsYXRlLFxuICAgICAgICAgICAgICAgIGlkOiBnZW5lcmF0ZUluc3RhbmNlSWQoKSxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10gYXMgSXRlbVtdLFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgdGl0bGU6IHRpdGxlLnRyaW0oKSwgd2lwTGltaXQ6IGRlZmF1bHRXaXAgfSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgYm9hcmRNb2RpZmllcnMuYWRkQ29sdW1uKFtzd2ltbGFuZUluZGV4XSwgY29sdW1uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIG1vZGFsLm9wZW4oKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKCdSZW5hbWUgc3dpbWxhbmUuLi4nKVxuICAgICAgICAuc2V0SWNvbignbHVjaWRlLWVkaXQnKVxuICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgSW5wdXRNb2RhbChcbiAgICAgICAgICAgIHN0YXRlTWFuYWdlci5hcHAsXG4gICAgICAgICAgICAnU3dpbWxhbmUgbmFtZTonLFxuICAgICAgICAgICAgc3dpbWxhbmUuZGF0YS50aXRsZSxcbiAgICAgICAgICAgIChuZXdUaXRsZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIW5ld1RpdGxlPy50cmltKCkpIHJldHVybjtcbiAgICAgICAgICAgICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZDogQm9hcmRUeXBlKSA9PlxuICAgICAgICAgICAgICAgIHVwZGF0ZUVudGl0eShib2FyZCwgW3N3aW1sYW5lSW5kZXhdLCB7XG4gICAgICAgICAgICAgICAgICBkYXRhOiB7ICRtZXJnZTogeyB0aXRsZTogbmV3VGl0bGUudHJpbSgpIH0gfSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbG91ck9wdGlvbnM6IHsgbmFtZTogc3RyaW5nOyBpY29uOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyBuYW1lOiAnYmx1ZScsICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnZ3JlZW4nLCAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAncmVkJywgICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnb3JhbmdlJywgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAncHVycGxlJywgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAncGluaycsICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnY3lhbicsICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnZ29sZCcsICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnYW1iZXInLCAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnamFkZScsICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnYnJvbnplJywgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAnc2NhcmxldCcsIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgICAgeyBuYW1lOiAndGVhbCcsICAgIGljb246ICdsdWNpZGUtY2lyY2xlJyB9LFxuICAgIF07XG5cbiAgICBjb25zdCBzZXRDb2xvdXIgPSAoY29sb3I6IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZDogQm9hcmRUeXBlKSA9PlxuICAgICAgICB1cGRhdGVFbnRpdHkoYm9hcmQsIFtzd2ltbGFuZUluZGV4XSwge1xuICAgICAgICAgIGRhdGE6IHsgJG1lcmdlOiB7IGNvbG9yIH0gfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciB1bmRvY3VtZW50ZWQgT2JzaWRpYW4gQVBJOiBNZW51SXRlbS5zZXRTdWJtZW51XG4gICAgICBjb25zdCBzdWIgPSBpdGVtLnNldFN1Ym1lbnUoKTtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoJ1NldCBjb2xvdXInKS5zZXRJY29uKCdsdWNpZGUtcGFsZXR0ZScpO1xuICAgICAgZm9yIChjb25zdCBvcHQgb2YgY29sb3VyT3B0aW9ucykge1xuICAgICAgICBzdWIuYWRkSXRlbSgoc2k6IE1lbnVJdGVtKSA9PiB7XG4gICAgICAgICAgY29uc3QgbGFiZWwgPSBzd2ltbGFuZS5kYXRhLmNvbG9yID09PSBvcHQubmFtZVxuICAgICAgICAgICAgPyBg4pePICR7b3B0Lm5hbWV9YFxuICAgICAgICAgICAgOiBg4peLICR7b3B0Lm5hbWV9YDtcbiAgICAgICAgICBzaS5zZXRUaXRsZShsYWJlbCkuc2V0SWNvbihvcHQuaWNvbikub25DbGljaygoKSA9PiBzZXRDb2xvdXIob3B0Lm5hbWUpKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzdWIuYWRkU2VwYXJhdG9yKCk7XG4gICAgICBzdWIuYWRkSXRlbSgoc2k6IE1lbnVJdGVtKSA9PiB7XG4gICAgICAgIHNpLnNldFRpdGxlKCdDbGVhciBjb2xvdXInKS5zZXRJY29uKCdsdWNpZGUteC1jaXJjbGUnKS5vbkNsaWNrKCgpID0+IHNldENvbG91cih1bmRlZmluZWQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZSgnRWRpdCBzY2FmZm9sZC4uLicpXG4gICAgICAgIC5zZXRJY29uKCdsdWNpZGUtbGlzdCcpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50ID0gKHN3aW1sYW5lLmRhdGEuc2NhZmZvbGQgfHwgW10pLmpvaW4oJ1xcbicpO1xuICAgICAgICAgIGNvbnN0IG1vZGFsID0gbmV3IFRleHRhcmVhTW9kYWwoXG4gICAgICAgICAgICBzdGF0ZU1hbmFnZXIuYXBwLFxuICAgICAgICAgICAgJ1NjYWZmb2xkIHRhc2tzIChvbmUgcGVyIGxpbmUpOicsXG4gICAgICAgICAgICBjdXJyZW50LFxuICAgICAgICAgICAgKHZhbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICAgIGNvbnN0IHRhc2tzID0gdmFsLnNwbGl0KCdcXG4nKS5tYXAodCA9PiB0LnRyaW0oKSkuZmlsdGVyKHQgPT4gdC5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZDogQm9hcmRUeXBlKSA9PlxuICAgICAgICAgICAgICAgIHVwZGF0ZUVudGl0eShib2FyZCwgW3N3aW1sYW5lSW5kZXhdLCB7XG4gICAgICAgICAgICAgICAgICBkYXRhOiB7ICRtZXJnZTogeyBzY2FmZm9sZDogdGFza3MubGVuZ3RoID4gMCA/IHRhc2tzIDogdW5kZWZpbmVkIH0gfSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdTdGFuZHVwIFtwcmlvcml0eTo6UDBdXFxuQ29kZSByZXZpZXcgW3ByaW9yaXR5OjpQMV1cXG5XZWVrbHkgcmVwb3J0JyxcbiAgICAgICAgICAgICAgaGludDogJ0FkZCBbcHJpb3JpdHk6OlhdIHRvIHNldCBhIHByaW9yaXR5LCBlLmcuIFAwLCBQMSwgaGlnaCwgbG93JyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIG1vZGFsLm9wZW4oKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW1cbiAgICAgICAgLnNldFRpdGxlKCdDbGVhciBhbGwgY2FyZHMnKVxuICAgICAgICAuc2V0SWNvbignbHVjaWRlLWVyYXNlcicpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICBzdGF0ZU1hbmFnZXIuc2V0U3RhdGUoKGJvYXJkOiBCb2FyZFR5cGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN3aW1sYW5lID0gZ2V0RW50aXR5RnJvbVBhdGgoYm9hcmQsIFtzd2ltbGFuZUluZGV4XSk7XG4gICAgICAgICAgICBsZXQgdXBkYXRlZCA9IGJvYXJkO1xuICAgICAgICAgICAgc3dpbWxhbmUuY2hpbGRyZW4uZm9yRWFjaCgoXzogdW5rbm93biwgY29sSW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICB1cGRhdGVkID0gdXBkYXRlRW50aXR5KHVwZGF0ZWQsIFtzd2ltbGFuZUluZGV4LCBjb2xJbmRleF0sIHsgY2hpbGRyZW46IHsgJHNldDogW10gfSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZSgnRGVtb3RlIHRvIGNhcmQnKVxuICAgICAgICAuc2V0SWNvbignbHVjaWRlLWFycm93LWRvd24tdG8tbGluZScpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICBib2FyZE1vZGlmaWVycy5kZW1vdGVUb0NhcmQoc3dpbWxhbmVJbmRleCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XG4gICAgICBpdGVtXG4gICAgICAgIC5zZXRUaXRsZSgnRGVsZXRlIHN3aW1sYW5lJylcbiAgICAgICAgLnNldEljb24oJ2x1Y2lkZS10cmFzaCcpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICBib2FyZE1vZGlmaWVycy5kZWxldGVFbnRpdHkoW3N3aW1sYW5lSW5kZXhdKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZSk7XG4gIH07XG5cbiAgY29uc3QgQ1VTVE9NX0NPTE9SUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBnb2xkOiAgICAnI0U4Qzg0QScsXG4gICAgYW1iZXI6ICAgJyNENDkyMEEnLFxuICAgIGphZGU6ICAgICcjM0Q3QTVFJyxcbiAgICBicm9uemU6ICAnI0EwNzgzMCcsXG4gICAgc2NhcmxldDogJyNDQzExMTEnLFxuICAgIHRlYWw6ICAgICcjMkE4QThBJyxcbiAgfTtcblxuICBjb25zdCBhY2NlbnRTdHlsZSA9IHN3aW1sYW5lLmRhdGEuY29sb3JcbiAgICA/ICh7XG4gICAgICAgICctLXN3aW1sYW5lLWFjY2VudCc6IHN3aW1sYW5lLmRhdGEuY29sb3Iuc3RhcnRzV2l0aCgnIycpXG4gICAgICAgICAgPyBzd2ltbGFuZS5kYXRhLmNvbG9yXG4gICAgICAgICAgOiBDVVNUT01fQ09MT1JTW3N3aW1sYW5lLmRhdGEuY29sb3JdXG4gICAgICAgICAgICA/IENVU1RPTV9DT0xPUlNbc3dpbWxhbmUuZGF0YS5jb2xvcl1cbiAgICAgICAgICAgIDogYHZhcigtLWNvbG9yLSR7c3dpbWxhbmUuZGF0YS5jb2xvcn0pYCxcbiAgICAgIH0gYXMgSlNYLkNTU1Byb3BlcnRpZXMpXG4gICAgOiB1bmRlZmluZWQ7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHJlZj17bWVhc3VyZVJlZn0gY2xhc3NOYW1lPXtjKCdzd2ltbGFuZScpfSBzdHlsZT17YWNjZW50U3R5bGV9PlxuICAgICAgPERyb3BwYWJsZVxuICAgICAgICBlbGVtZW50UmVmPXtlbGVtZW50UmVmfVxuICAgICAgICBtZWFzdXJlUmVmPXttZWFzdXJlUmVmfVxuICAgICAgICBpZD17c3dpbWxhbmUuaWR9XG4gICAgICAgIGluZGV4PXtzd2ltbGFuZUluZGV4fVxuICAgICAgICBkYXRhPXtkYXRhfVxuICAgICAgPlxuICAgICAgICA8ZGl2IHJlZj17ZWxlbWVudFJlZn0+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2MoJ3N3aW1sYW5lLWhlYWRlcicpfSBvbkNvbnRleHRNZW51PXtoYW5kbGVDb250ZXh0TWVudX0+XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17Yygnc3dpbWxhbmUtY29sbGFwc2UnKSArIChjb2xsYXBzZWQgPyBgICR7Yygnc3dpbWxhbmUtY29sbGFwc2UtLWNvbGxhcHNlZCcpfWAgOiAnJyl9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldENvbGxhcHNlZCghY29sbGFwc2VkKX1cbiAgICAgICAgICAgICAgdGl0bGU9e2NvbGxhcHNlZCA/ICdFeHBhbmQnIDogJ0NvbGxhcHNlJ31cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2MoJ3N3aW1sYW5lLXRpdGxlJyl9Pntzd2ltbGFuZS5kYXRhLnRpdGxlfTwvc3Bhbj5cbiAgICAgICAgICAgIHtzd2ltbGFuZS5kYXRhLnNjYWZmb2xkICYmIHN3aW1sYW5lLmRhdGEuc2NhZmZvbGQubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2MoJ3N3aW1sYW5lLXJlbG9hZCcpfVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVJlbG9hZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17YFJlbG9hZCBpbnRvIFwiJHtzd2ltbGFuZS5jaGlsZHJlblswXT8uZGF0YS50aXRsZX1cIjpcXG4ke3N3aW1sYW5lLmRhdGEuc2NhZmZvbGQubWFwKHQgPT4gYOKAoiAke3R9YCkuam9pbignXFxuJyl9YH1cbiAgICAgICAgICAgICAgICBkYXRhLWlnbm9yZS1kcmFnXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICBSRUxPQURcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAge2hhc0FueUNhcmRzICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Yygnc3dpbWxhbmUtY2xlYXInKX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVDbGVhcn1cbiAgICAgICAgICAgICAgICB0aXRsZT1cIkNsZWFyIGFsbCBjYXJkcyBmcm9tIHRoaXMgc3dpbWxhbmVcIlxuICAgICAgICAgICAgICAgIGRhdGEtaWdub3JlLWRyYWdcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIENMRUFSXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIHtjbGVhcmVkU25hcHNob3QubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2MoJ3N3aW1sYW5lLXVuY2xlYXInKX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVVbmNsZWFyfVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiVW5kbyBjbGVhciBhbmQgcmVzdG9yZSBhbGwgY2FyZHNcIlxuICAgICAgICAgICAgICAgIGRhdGEtaWdub3JlLWRyYWdcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIFVOQ0xFQVJcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtjKCdzd2ltbGFuZS1jb3VudCcpfT5cbiAgICAgICAgICAgICAge3N3aW1sYW5lLmNoaWxkcmVuLnJlZHVjZSgoc3VtLCBjb2wpID0+IHN1bSArIGNvbC5jaGlsZHJlbi5sZW5ndGgsIDApfSBjYXJkc1xuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2MoJ3N3aW1sYW5lLWRlc2NyaXB0aW9uLXdyYXAnKX0+XG4gICAgICAgICAgICB7aXNFZGl0aW5nRGVzYyA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2MoJ3N3aW1sYW5lLWRlc2MtZWRpdG9yLXdyYXAnKX0+XG4gICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICByZWY9e3RleHRhcmVhUmVmfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjKCdzd2ltbGFuZS1kZXNjcmlwdGlvbi1lZGl0b3InKX1cbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlZGl0RGVzY31cbiAgICAgICAgICAgICAgICAgIG9uSW5wdXQ9e2hhbmRsZURlc2NJbnB1dH1cbiAgICAgICAgICAgICAgICAgIG9uQmx1cj17c2F2ZURlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXtoYW5kbGVEZXNjS2V5RG93bn1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRGVzY3JpYmUgdGhlIGZsb3cgb2YgdGhpcyBzd2ltbGFuZS4uLiAoc3VwcG9ydHMgW1t3aWtpIGxpbmtzXV0pXCJcbiAgICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICB7d2xTdWdnZXN0aW9ucy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjKCd3bC1zdWdnZXN0Jyl9PlxuICAgICAgICAgICAgICAgICAgICB7d2xTdWdnZXN0aW9ucy5tYXAoKGZpbGUsIGkpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2ZpbGUucGF0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGMoJ3dsLXN1Z2dlc3QtaXRlbScpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKGkgPT09IHdsSW5kZXggPyAnICcgKyBjKCd3bC1zdWdnZXN0LWl0ZW0tLWFjdGl2ZScpIDogJycpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBwcmV2ZW50IHRleHRhcmVhIGJsdXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0V2xTdWdnZXN0aW9uKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2MoJ3dsLXN1Z2dlc3QtaWNvbicpfT7in6bin6c8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2MoJ3dsLXN1Z2dlc3QtbmFtZScpfT57ZmlsZS5iYXNlbmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2MoJ3dsLXN1Z2dlc3QtcGF0aCcpfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2ZpbGUucGFyZW50Py5wYXRoICE9PSAnLycgPyBmaWxlLnBhcmVudD8ucGF0aCA6ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Yygnc3dpbWxhbmUtZGVzY3JpcHRpb24nKSArIChzd2ltbGFuZS5kYXRhLmRlc2NyaXB0aW9uID8gJycgOiAnICcgKyBjKCdzd2ltbGFuZS1kZXNjcmlwdGlvbi0tZW1wdHknKSl9XG4gICAgICAgICAgICAgICAgcmVmPXtkZXNjcmlwdGlvblJlZn1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0VkaXRpbmdEZXNjKHRydWUpfVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2xpY2sgdG8gZWRpdCBkZXNjcmlwdGlvblwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IXN3aW1sYW5lLmRhdGEuZGVzY3JpcHRpb24gJiYgKFxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtjKCdzd2ltbGFuZS1kZXNjcmlwdGlvbi1wbGFjZWhvbGRlcicpfT5cbiAgICAgICAgICAgICAgICAgICAgRGVzY3JpYmUgdGhlIGZsb3cgb2YgdGhpcyBzd2ltbGFuZS4uLlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHshY29sbGFwc2VkICYmIChcbiAgICAgICAgICAgIDxTb3J0YWJsZSBheGlzPVwiaG9yaXpvbnRhbFwiPlxuICAgICAgICAgICAgICA8U2Nyb2xsQ29udGFpbmVyXG4gICAgICAgICAgICAgICAgaWQ9e3N3aW1sYW5lLmlkfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Yygnc3dpbWxhbmUtY29sdW1ucycpfVxuICAgICAgICAgICAgICAgIHRyaWdnZXJUeXBlcz17Q09MVU1OX1RSSUdHRVJfVFlQRVN9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7c3dpbWxhbmUuY2hpbGRyZW4ubWFwKChjb2x1bW4sIGkpID0+IChcbiAgICAgICAgICAgICAgICAgIDxDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAga2V5PXtjb2x1bW4uaWR9XG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbj17Y29sdW1ufVxuICAgICAgICAgICAgICAgICAgICBjb2x1bW5JbmRleD17aX1cbiAgICAgICAgICAgICAgICAgICAgc3dpbWxhbmVJbmRleD17c3dpbWxhbmVJbmRleH1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPFNvcnRQbGFjZWhvbGRlclxuICAgICAgICAgICAgICAgICAgaW5kZXg9e3N3aW1sYW5lLmNoaWxkcmVuLmxlbmd0aH1cbiAgICAgICAgICAgICAgICAgIGFjY2VwdHM9e1tEYXRhVHlwZXMuQ29sdW1uXX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Yygnc29ydC1wbGFjZWhvbGRlcicpfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvU2Nyb2xsQ29udGFpbmVyPlxuICAgICAgICAgICAgPC9Tb3J0YWJsZT5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvRHJvcHBhYmxlPlxuICAgIDwvZGl2PlxuICApO1xufVxuIl19