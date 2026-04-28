import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "preact/jsx-runtime";
import { Menu } from 'obsidian';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/compat';
import { Droppable } from '../dnd/components/Droppable';
import { useDragHandle } from '../dnd/managers/DragManager';
import { removeEntity, updateEntity } from '../dnd/util/data';
import { DataTypes, generateInstanceId } from '../types';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';
import { InputModal } from './InputModal';
import { WikiLinkDropdown, useWikiLinkSuggest } from './WikiLinkSuggest';
// 11-step blue palette: index = score value (0–10)
const SCORE_PALETTE = [
    { bg: '#eff6ff', color: '#1e40af' }, // 0 – lightest
    { bg: '#dbeafe', color: '#1e40af' }, // 1
    { bg: '#bfdbfe', color: '#1e3a8a' }, // 2
    { bg: '#93c5fd', color: '#1e3a8a' }, // 3
    { bg: '#60a5fa', color: '#ffffff' }, // 4
    { bg: '#3b82f6', color: '#ffffff' }, // 5
    { bg: '#2563eb', color: '#ffffff' }, // 6
    { bg: '#1d4ed8', color: '#ffffff' }, // 7
    { bg: '#1e40af', color: '#ffffff' }, // 8
    { bg: '#1e3a8a', color: '#ffffff' }, // 9
    { bg: '#172554', color: '#ffffff' }, // 10 – darkest
];
export function scoreStyles(score) {
    const palette = SCORE_PALETTE[Math.max(0, Math.min(10, score))];
    return { backgroundColor: palette.bg, color: palette.color };
}
function deepCloneItem(item) {
    return {
        ...item,
        id: generateInstanceId(),
        children: item.children.map((child) => deepCloneItem(child)),
    };
}
// Render a title string, turning [[link]] and [[link|alias]] into clickable anchors
function renderTitle(title, sourcePath, openLink) {
    const parts = title.split(/(\[\[[^\]]+\]\])/);
    return parts.map((part, i) => {
        var _a;
        const m = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
        if (m) {
            const target = m[1].trim();
            const display = ((_a = m[2]) === null || _a === void 0 ? void 0 : _a.trim()) || target;
            return (_jsx("a", { class: "internal-link", href: target, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openLink(target);
                }, onMouseDown: (e) => e.stopPropagation(), "data-ignore-drag": true, children: display }, i));
        }
        return part;
    });
}
export function Card({ item, itemIndex, columnPath, isStatic }) {
    var _a, _b, _c, _d, _e, _f;
    const { boardModifiers, view, stateManager } = useContext(SwimlaneKanbanContext);
    const itemPath = [...columnPath, itemIndex];
    const elementRef = useRef(null);
    const measureRef = useRef(null);
    const textareaRef = useRef(null);
    const [collapsed, setCollapsed] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [completing, setCompleting] = useState(false);
    const completingTimer = useRef(null);
    const { suggest: linkSuggest, anchor: linkAnchor, accept: acceptLink, handleKeyDown: suggestKeyDown } = useWikiLinkSuggest(stateManager.app, editValue, setEditValue, textareaRef);
    const isProject = item.children.length > 0;
    const isTopLevel = columnPath.length === 2;
    // Column move arrows: only for top-level cards
    const swimlaneIdx = columnPath[0];
    const columnIdx = columnPath[1];
    const columnCount = isTopLevel
        ? ((_e = (_d = (_c = (_b = (_a = stateManager.state) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b[swimlaneIdx]) === null || _c === void 0 ? void 0 : _c.children) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0)
        : 0;
    const showLeftArrow = isTopLevel && columnIdx > 0;
    const showRightArrow = isTopLevel && columnIdx < columnCount - 1;
    const data = useMemo(() => {
        var _a;
        return ({
            id: item.id,
            type: DataTypes.Item,
            accepts: [DataTypes.Item],
            acceptsSort: isTopLevel ? [] : undefined,
            win: ((_a = view === null || view === void 0 ? void 0 : view.getWindow) === null || _a === void 0 ? void 0 : _a.call(view)) || window,
        });
    }, [item.id, isTopLevel]);
    const setDragHandle = useDragHandle(measureRef, elementRef);
    // Focus and resize textarea when entering edit mode
    useEffect(() => {
        if (editing && textareaRef.current) {
            const el = textareaRef.current;
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
            el.style.setProperty('height', 'auto');
            el.style.setProperty('height', el.scrollHeight + 'px');
        }
    }, [editing]);
    const autoResize = useCallback((el) => {
        el.style.setProperty('height', 'auto');
        el.style.setProperty('height', el.scrollHeight + 'px');
    }, []);
    const commitEdit = useCallback(() => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== item.data.title) {
            boardModifiers.updateItem(itemPath, {
                ...item,
                data: { ...item.data, title: trimmed },
            });
        }
        setEditing(false);
    }, [editValue, item, itemPath, boardModifiers]);
    const handleTitleDblClick = (e) => {
        e.preventDefault();
        setEditValue(item.data.title);
        setEditing(true);
    };
    const handleTextareaKeyDown = (e) => {
        if (suggestKeyDown(e))
            return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commitEdit();
        }
        else if (e.key === 'Escape') {
            setEditing(false);
        }
    };
    const handleCheckboxChange = () => {
        const nowChecked = !item.data.checked;
        // Update the checked state immediately
        boardModifiers.updateItem(itemPath, {
            ...item,
            data: { ...item.data, checked: nowChecked },
        });
        if (nowChecked) {
            // Start 3-second countdown to move to Done/last column
            setCompleting(true);
            const cardId = item.id;
            completingTimer.current = setTimeout(() => {
                setCompleting(false);
                // Move card to Done column (or last column) in the same swimlane
                stateManager.setState((board) => {
                    const swimlaneIdx = columnPath[0];
                    const swimlane = board.children[swimlaneIdx];
                    if (!swimlane)
                        return board;
                    // Find the card's current location by ID (index may have shifted)
                    let sourceColIdx = -1;
                    let sourceItemIdx = -1;
                    for (let ci = 0; ci < swimlane.children.length; ci++) {
                        const col = swimlane.children[ci];
                        const ii = col.children.findIndex((c) => c.id === cardId);
                        if (ii !== -1) {
                            sourceColIdx = ci;
                            sourceItemIdx = ii;
                            break;
                        }
                    }
                    if (sourceColIdx === -1)
                        return board;
                    let targetColIdx = swimlane.children.findIndex((col) => /^done$/i.test(col.data.title));
                    if (targetColIdx === -1)
                        targetColIdx = swimlane.children.length - 1;
                    // Don't move if already in the target column
                    if (targetColIdx === sourceColIdx)
                        return board;
                    const movedItem = swimlane.children[sourceColIdx].children[sourceItemIdx];
                    // Remove from source column, then push into target column
                    const afterRemove = removeEntity(board, [swimlaneIdx, sourceColIdx, sourceItemIdx]);
                    // After removal, adjust target index if it was after the source in the same swimlane
                    // (column indices don't shift since we're removing an item, not a column)
                    return updateEntity(afterRemove, [swimlaneIdx, targetColIdx], {
                        children: { $push: [movedItem] },
                    });
                });
            }, 3000);
        }
        else {
            // Unchecked during countdown — cancel move
            if (completingTimer.current) {
                clearTimeout(completingTimer.current);
                completingTimer.current = null;
            }
            setCompleting(false);
        }
    };
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (completingTimer.current)
                clearTimeout(completingTimer.current);
        };
    }, []);
    const promptScore = () => {
        const current = item.data.score !== undefined ? String(item.data.score) : '';
        const modal = new InputModal(stateManager.app, 'Score (0–10, leave blank to clear):', current, (val) => {
            if (val === null)
                return;
            const trimmed = val.trim();
            if (!trimmed) {
                boardModifiers.updateItem(itemPath, { ...item, data: { ...item.data, score: undefined } });
                return;
            }
            const num = parseInt(trimmed, 10);
            if (!isNaN(num) && num >= 0 && num <= 10) {
                boardModifiers.updateItem(itemPath, { ...item, data: { ...item.data, score: num } });
            }
        });
        modal.open();
    };
    const handleContextMenu = (e) => {
        if (editing)
            return;
        e.preventDefault();
        const menu = new Menu();
        menu.addItem((menuItem) => {
            menuItem
                .setTitle('Set score (0–10)...')
                .setIcon('lucide-gauge')
                .onClick(promptScore);
        });
        menu.addItem((menuItem) => {
            menuItem
                .setTitle('Set priority...')
                .setIcon('lucide-signal')
                .onClick(() => {
                const current = item.data.priority || '';
                const modal = new InputModal(stateManager.app, 'Priority (e.g. P0, high, 1 — leave blank to clear):', current, (val) => {
                    if (val === null)
                        return;
                    const trimmed = val.trim();
                    boardModifiers.updateItem(itemPath, {
                        ...item,
                        data: { ...item.data, priority: trimmed || undefined },
                    });
                });
                modal.open();
            });
        });
        if (isProject) {
            menu.addItem((menuItem) => {
                menuItem
                    .setTitle('Ungroup cards')
                    .setIcon('lucide-ungroup')
                    .onClick(() => boardModifiers.ungroupItems(itemPath));
            });
        }
        menu.addItem((menuItem) => {
            menuItem
                .setTitle('Duplicate card')
                .setIcon('lucide-copy')
                .onClick(() => {
                boardModifiers.insertItems([...columnPath, itemIndex + 1], [deepCloneItem(item)]);
            });
        });
        menu.addItem((menuItem) => {
            menuItem
                .setTitle('Promote to swimlane')
                .setIcon('lucide-arrow-up-from-line')
                .onClick(() => boardModifiers.promoteToSwimlane(itemPath));
        });
        menu.addItem((menuItem) => {
            menuItem
                .setTitle('Delete card')
                .setIcon('lucide-trash')
                .onClick(() => boardModifiers.deleteEntity(itemPath));
        });
        menu.showAtMouseEvent(e);
    };
    const titleArea = editing ? (_jsxs(_Fragment, { children: [_jsx("textarea", { ref: textareaRef, className: c('card-title-editor'), value: editValue, onInput: (e) => {
                    const el = e.target;
                    setEditValue(el.value);
                    autoResize(el);
                }, onKeyDown: handleTextareaKeyDown, onBlur: commitEdit, "data-ignore-drag": true, rows: 1 }), linkSuggest && linkAnchor && (_jsx(WikiLinkDropdown, { suggest: linkSuggest, anchor: linkAnchor, accept: acceptLink, close: () => { } }))] })) : (_jsx("span", { ref: setDragHandle, className: c('card-title'), onDblClick: handleTitleDblClick, children: renderTitle(item.data.title, ((_f = view === null || view === void 0 ? void 0 : view.file) === null || _f === void 0 ? void 0 : _f.path) || '', (target) => { var _a; return stateManager.app.workspace.openLinkText(target, ((_a = view === null || view === void 0 ? void 0 : view.file) === null || _a === void 0 ? void 0 : _a.path) || '', false); }) }));
    const cardContent = (_jsxs("div", { ref: elementRef, className: c('card') +
            (isProject ? ` ${c('card--project')}` : '') +
            (completing ? ` ${c('card--completing')}` : ''), onContextMenu: handleContextMenu, children: [completing && _jsx("div", { className: c('card-countdown-bar') }), showLeftArrow && (_jsx("button", { className: c('card-move-btn') + ' ' + c('card-move-btn--left'), onClick: (e) => {
                    e.stopPropagation();
                    boardModifiers.moveItemToColumn(itemPath, -1);
                }, onMouseDown: (e) => e.stopPropagation(), "data-ignore-drag": true, title: "Move to previous column", children: "\u25C0" })), _jsx("input", { type: "checkbox", checked: item.data.checked, onChange: handleCheckboxChange, className: c('card-checkbox'), "data-ignore-drag": true }), titleArea, item.data.priority && (_jsx("span", { className: c('card-priority'), children: item.data.priority })), item.data.score !== undefined ? (_jsx("span", { className: c('card-score'), style: scoreStyles(item.data.score), onClick: (e) => { e.stopPropagation(); promptScore(); }, onMouseDown: (e) => e.stopPropagation(), "data-ignore-drag": true, children: item.data.score })) : (_jsx("span", { className: c('card-score') + ' ' + c('card-score--missing'), onClick: (e) => { e.stopPropagation(); promptScore(); }, onMouseDown: (e) => e.stopPropagation(), "data-ignore-drag": true, children: "-" })), isProject && (_jsx("button", { className: c('card-collapse-btn'), onClick: (e) => {
                    e.stopPropagation();
                    setCollapsed((v) => !v);
                }, "data-ignore-drag": true, title: collapsed ? 'Expand sub-cards' : 'Collapse sub-cards', children: collapsed ? `▶ ${item.children.length}` : `▼ ${item.children.length}` })), showRightArrow && (_jsx("button", { className: c('card-move-btn') + ' ' + c('card-move-btn--right'), onClick: (e) => {
                    e.stopPropagation();
                    boardModifiers.moveItemToColumn(itemPath, 1);
                }, onMouseDown: (e) => e.stopPropagation(), "data-ignore-drag": true, title: "Move to next column", children: "\u25B6" }))] }));
    const subItems = isProject && !collapsed ? (_jsx("div", { className: c('card-children'), children: item.children.map((subItem, i) => (_jsx(Card, { item: subItem, itemIndex: i, columnPath: itemPath }, subItem.id))) })) : null;
    if (isStatic) {
        return (_jsxs("div", { ref: measureRef, children: [cardContent, subItems] }));
    }
    return (_jsx("div", { ref: measureRef, children: _jsxs(Droppable, { elementRef: elementRef, measureRef: measureRef, id: item.id, index: itemIndex, data: data, children: [cardContent, subItems] }) }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNhcmQudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRWhDLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU5RixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDeEQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFOUQsT0FBTyxFQUFFLFNBQVMsRUFBUSxrQkFBa0IsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMvRCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDbEQsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUM5QixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBU3pFLG1EQUFtRDtBQUNuRCxNQUFNLGFBQWEsR0FBb0M7SUFDckQsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxlQUFlO0lBQ3BELEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSTtJQUN6QyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLElBQUk7SUFDekMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJO0lBQ3pDLEVBQUUsRUFBRSxFQUFFLFNB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T0FBTyxDQUNMLGVBQUssR0FBRyxFQUFFLFVBQVUsYUFDakIsV0FBVyxFQUNYLFFBQVEsSUFDTCxDQUNQLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTyxDQUNMLGNBQUssR0FBRyxFQUFFLFVBQVUsWUFDbEIsTUFBQyxTQUFTLElBQ1IsVUFBVSxFQUFFLFVBQVUsRUFDdEIsVUFBVSxFQUFFLFVBQVUsRUFDdEIsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQ1gsS0FBSyxFQUFFLFNBQVMsRUFDaEIsSUFBSSxFQUFFLElBQUksYUFFVCxXQUFXLEVBQ1gsUUFBUSxJQUNDLEdBQ1IsQ0FDUCxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lbnUgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBKU1ggfSBmcm9tICdwcmVhY3QnO1xuaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZUNvbnRleHQsIHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3ByZWFjdC9jb21wYXQnO1xuXG5pbXBvcnQgeyBEcm9wcGFibGUgfSBmcm9tICcuLi9kbmQvY29tcG9uZW50cy9Ecm9wcGFibGUnO1xuaW1wb3J0IHsgdXNlRHJhZ0hhbmRsZSB9IGZyb20gJy4uL2RuZC9tYW5hZ2Vycy9EcmFnTWFuYWdlcic7XG5pbXBvcnQgeyByZW1vdmVFbnRpdHksIHVwZGF0ZUVudGl0eSB9IGZyb20gJy4uL2RuZC91dGlsL2RhdGEnO1xuaW1wb3J0IHsgRW50aXR5RGF0YSB9IGZyb20gJy4uL2RuZC90eXBlcyc7XG5pbXBvcnQgeyBEYXRhVHlwZXMsIEl0ZW0sIGdlbmVyYXRlSW5zdGFuY2VJZCB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IFN3aW1sYW5lS2FuYmFuQ29udGV4dCB9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQgeyBjIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IElucHV0TW9kYWwgfSBmcm9tICcuL0lucHV0TW9kYWwnO1xuaW1wb3J0IHsgV2lraUxpbmtEcm9wZG93biwgdXNlV2lraUxpbmtTdWdnZXN0IH0gZnJvbSAnLi9XaWtpTGlua1N1Z2dlc3QnO1xuXG5pbnRlcmZhY2UgQ2FyZFByb3BzIHtcbiAgaXRlbTogSXRlbTtcbiAgaXRlbUluZGV4OiBudW1iZXI7XG4gIGNvbHVtblBhdGg6IG51bWJlcltdO1xuICBpc1N0YXRpYz86IGJvb2xlYW47XG59XG5cbi8vIDExLXN0ZXAgYmx1ZSBwYWxldHRlOiBpbmRleCA9IHNjb3JlIHZhbHVlICgw4oCTMTApXG5jb25zdCBTQ09SRV9QQUxFVFRFOiB7IGJnOiBzdHJpbmc7IGNvbG9yOiBzdHJpbmcgfVtdID0gW1xuICB7IGJnOiAnI2VmZjZmZicsIGNvbG9yOiAnIzFlNDBhZicgfSwgLy8gMCDigJMgbGlnaHRlc3RcbiAgeyBiZzogJyNkYmVhZmUnLCBjb2xvcjogJyMxZTQwYWYnIH0sIC8vIDFcbiAgeyBiZzogJyNiZmRiZmUnLCBjb2xvcjogJyMxZTNhOGEnIH0sIC8vIDJcbiAgeyBiZzogJyM5M2M1ZmQnLCBjb2xvcjogJyMxZTNhOGEnIH0sIC8vIDNcbiAgeyBiZzogJyM2MGE1ZmEnLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDRcbiAgeyBiZzogJyMzYjgyZjYnLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDVcbiAgeyBiZzogJyMyNTYzZWInLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDZcbiAgeyBiZzogJyMxZDRlZDgnLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDdcbiAgeyBiZzogJyMxZTQwYWYnLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDhcbiAgeyBiZzogJyMxZTNhOGEnLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDlcbiAgeyBiZzogJyMxNzI1NTQnLCBjb2xvcjogJyNmZmZmZmYnIH0sIC8vIDEwIOKAkyBkYXJrZXN0XG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVTdHlsZXMoc2NvcmU6IG51bWJlcik6IEpTWC5DU1NQcm9wZXJ0aWVzIHtcbiAgY29uc3QgcGFsZXR0ZSA9IFNDT1JFX1BBTEVUVEVbTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAsIHNjb3JlKSldO1xuICByZXR1cm4geyBiYWNrZ3JvdW5kQ29sb3I6IHBhbGV0dGUuYmcsIGNvbG9yOiBwYWxldHRlLmNvbG9yIH07XG59XG5cbmZ1bmN0aW9uIGRlZXBDbG9uZUl0ZW0oaXRlbTogSXRlbSk6IEl0ZW0ge1xuICByZXR1cm4ge1xuICAgIC4uLml0ZW0sXG4gICAgaWQ6IGdlbmVyYXRlSW5zdGFuY2VJZCgpLFxuICAgIGNoaWxkcmVuOiBpdGVtLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGRlZXBDbG9uZUl0ZW0oY2hpbGQgYXMgSXRlbSkpLFxuICB9O1xufVxuXG4vLyBSZW5kZXIgYSB0aXRsZSBzdHJpbmcsIHR1cm5pbmcgW1tsaW5rXV0gYW5kIFtbbGlua3xhbGlhc11dIGludG8gY2xpY2thYmxlIGFuY2hvcnNcbmZ1bmN0aW9uIHJlbmRlclRpdGxlKFxuICB0aXRsZTogc3RyaW5nLFxuICBzb3VyY2VQYXRoOiBzdHJpbmcsXG4gIG9wZW5MaW5rOiAodGFyZ2V0OiBzdHJpbmcpID0+IHZvaWRcbik6IChKU1guRWxlbWVudCB8IHN0cmluZylbXSB7XG4gIGNvbnN0IHBhcnRzID0gdGl0bGUuc3BsaXQoLyhcXFtcXFtbXlxcXV0rXFxdXFxdKS8pO1xuICByZXR1cm4gcGFydHMubWFwKChwYXJ0LCBpKSA9PiB7XG4gICAgY29uc3QgbSA9IHBhcnQubWF0Y2goL15cXFtcXFsoW15cXF18XSspKD86XFx8KFteXFxdXSspKT9cXF1cXF0kLyk7XG4gICAgaWYgKG0pIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IG1bMV0udHJpbSgpO1xuICAgICAgY29uc3QgZGlzcGxheSA9IG1bMl0/LnRyaW0oKSB8fCB0YXJnZXQ7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8YVxuICAgICAgICAgIGtleT17aX1cbiAgICAgICAgICBjbGFzcz1cImludGVybmFsLWxpbmtcIlxuICAgICAgICAgIGhyZWY9e3RhcmdldH1cbiAgICAgICAgICBvbkNsaWNrPXsoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIG9wZW5MaW5rKHRhcmdldCk7XG4gICAgICAgICAgfX1cbiAgICAgICAgICBvbk1vdXNlRG93bj17KGU6IE1vdXNlRXZlbnQpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCl9XG4gICAgICAgICAgZGF0YS1pZ25vcmUtZHJhZ1xuICAgICAgICA+XG4gICAgICAgICAge2Rpc3BsYXl9XG4gICAgICAgIDwvYT5cbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBwYXJ0O1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENhcmQoeyBpdGVtLCBpdGVtSW5kZXgsIGNvbHVtblBhdGgsIGlzU3RhdGljIH06IENhcmRQcm9wcykge1xuICBjb25zdCB7IGJvYXJkTW9kaWZpZXJzLCB2aWV3LCBzdGF0ZU1hbmFnZXIgfSA9IHVzZUNvbnRleHQoU3dpbWxhbmVLYW5iYW5Db250ZXh0KTtcbiAgY29uc3QgaXRlbVBhdGggPSBbLi4uY29sdW1uUGF0aCwgaXRlbUluZGV4XTtcbiAgY29uc3QgZWxlbWVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IG1lYXN1cmVSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCB0ZXh0YXJlYVJlZiA9IHVzZVJlZjxIVE1MVGV4dEFyZWFFbGVtZW50PihudWxsKTtcblxuICBjb25zdCBbY29sbGFwc2VkLCBzZXRDb2xsYXBzZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZWRpdGluZywgc2V0RWRpdGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtlZGl0VmFsdWUsIHNldEVkaXRWYWx1ZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjb21wbGV0aW5nLCBzZXRDb21wbGV0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY29tcGxldGluZ1RpbWVyID0gdXNlUmVmPFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbD4obnVsbCk7XG5cbiAgY29uc3QgeyBzdWdnZXN0OiBsaW5rU3VnZ2VzdCwgYW5jaG9yOiBsaW5rQW5jaG9yLCBhY2NlcHQ6IGFjY2VwdExpbmssIGhhbmRsZUtleURvd246IHN1Z2dlc3RLZXlEb3duIH0gPVxuICAgIHVzZVdpa2lMaW5rU3VnZ2VzdChzdGF0ZU1hbmFnZXIuYXBwLCBlZGl0VmFsdWUsIHNldEVkaXRWYWx1ZSwgdGV4dGFyZWFSZWYpO1xuXG4gIGNvbnN0IGlzUHJvamVjdCA9IGl0ZW0uY2hpbGRyZW4ubGVuZ3RoID4gMDtcbiAgY29uc3QgaXNUb3BMZXZlbCA9IGNvbHVtblBhdGgubGVuZ3RoID09PSAyO1xuXG4gIC8vIENvbHVtbiBtb3ZlIGFycm93czogb25seSBmb3IgdG9wLWxldmVsIGNhcmRzXG4gIGNvbnN0IHN3aW1sYW5lSWR4ID0gY29sdW1uUGF0aFswXTtcbiAgY29uc3QgY29sdW1uSWR4ID0gY29sdW1uUGF0aFsxXTtcbiAgY29uc3QgY29sdW1uQ291bnQgPSBpc1RvcExldmVsXG4gICAgPyAoc3RhdGVNYW5hZ2VyLnN0YXRlPy5jaGlsZHJlbj8uW3N3aW1sYW5lSWR4XT8uY2hpbGRyZW4/Lmxlbmd0aCA/PyAwKVxuICAgIDogMDtcbiAgY29uc3Qgc2hvd0xlZnRBcnJvdyA9IGlzVG9wTGV2ZWwgJiYgY29sdW1uSWR4ID4gMDtcbiAgY29uc3Qgc2hvd1JpZ2h0QXJyb3cgPSBpc1RvcExldmVsICYmIGNvbHVtbklkeCA8IGNvbHVtbkNvdW50IC0gMTtcblxuICBjb25zdCBkYXRhID0gdXNlTWVtbzxFbnRpdHlEYXRhPihcbiAgICAoKSA9PiAoe1xuICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICB0eXBlOiBEYXRhVHlwZXMuSXRlbSxcbiAgICAgIGFjY2VwdHM6IFtEYXRhVHlwZXMuSXRlbV0sXG4gICAgICBhY2NlcHRzU29ydDogaXNUb3BMZXZlbCA/IFtdIDogdW5kZWZpbmVkLFxuICAgICAgd2luOiB2aWV3Py5nZXRXaW5kb3c/LigpIHx8IHdpbmRvdyxcbiAgICB9KSxcbiAgICBbaXRlbS5pZCwgaXNUb3BMZXZlbF1cbiAgKTtcblxuICBjb25zdCBzZXREcmFnSGFuZGxlID0gdXNlRHJhZ0hhbmRsZShtZWFzdXJlUmVmLCBlbGVtZW50UmVmKTtcblxuICAvLyBGb2N1cyBhbmQgcmVzaXplIHRleHRhcmVhIHdoZW4gZW50ZXJpbmcgZWRpdCBtb2RlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGVkaXRpbmcgJiYgdGV4dGFyZWFSZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgZWwgPSB0ZXh0YXJlYVJlZi5jdXJyZW50O1xuICAgICAgZWwuZm9jdXMoKTtcbiAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKGVsLnZhbHVlLmxlbmd0aCwgZWwudmFsdWUubGVuZ3RoKTtcbiAgICAgIGVsLnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgZWwuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsIGVsLnNjcm9sbEhlaWdodCArICdweCcpO1xuICAgIH1cbiAgfSwgW2VkaXRpbmddKTtcblxuICBjb25zdCBhdXRvUmVzaXplID0gdXNlQ2FsbGJhY2soKGVsOiBIVE1MVGV4dEFyZWFFbGVtZW50KSA9PiB7XG4gICAgZWwuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgZWwuc3R5bGUuc2V0UHJvcGVydHkoJ2hlaWdodCcsIGVsLnNjcm9sbEhlaWdodCArICdweCcpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgY29tbWl0RWRpdCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjb25zdCB0cmltbWVkID0gZWRpdFZhbHVlLnRyaW0oKTtcbiAgICBpZiAodHJpbW1lZCAmJiB0cmltbWVkICE9PSBpdGVtLmRhdGEudGl0bGUpIHtcbiAgICAgIGJvYXJkTW9kaWZpZXJzLnVwZGF0ZUl0ZW0oaXRlbVBhdGgsIHtcbiAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgZGF0YTogeyAuLi5pdGVtLmRhdGEsIHRpdGxlOiB0cmltbWVkIH0sXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2V0RWRpdGluZyhmYWxzZSk7XG4gIH0sIFtlZGl0VmFsdWUsIGl0ZW0sIGl0ZW1QYXRoLCBib2FyZE1vZGlmaWVyc10pO1xuXG4gIGNvbnN0IGhhbmRsZVRpdGxlRGJsQ2xpY2sgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBzZXRFZGl0VmFsdWUoaXRlbS5kYXRhLnRpdGxlKTtcbiAgICBzZXRFZGl0aW5nKHRydWUpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVRleHRhcmVhS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKHN1Z2dlc3RLZXlEb3duKGUpKSByZXR1cm47XG4gICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb21taXRFZGl0KCk7XG4gICAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgIHNldEVkaXRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVDaGVja2JveENoYW5nZSA9ICgpID0+IHtcbiAgICBjb25zdCBub3dDaGVja2VkID0gIWl0ZW0uZGF0YS5jaGVja2VkO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjaGVja2VkIHN0YXRlIGltbWVkaWF0ZWx5XG4gICAgYm9hcmRNb2RpZmllcnMudXBkYXRlSXRlbShpdGVtUGF0aCwge1xuICAgICAgLi4uaXRlbSxcbiAgICAgIGRhdGE6IHsgLi4uaXRlbS5kYXRhLCBjaGVja2VkOiBub3dDaGVja2VkIH0sXG4gICAgfSk7XG5cbiAgICBpZiAobm93Q2hlY2tlZCkge1xuICAgICAgLy8gU3RhcnQgMy1zZWNvbmQgY291bnRkb3duIHRvIG1vdmUgdG8gRG9uZS9sYXN0IGNvbHVtblxuICAgICAgc2V0Q29tcGxldGluZyh0cnVlKTtcbiAgICAgIGNvbnN0IGNhcmRJZCA9IGl0ZW0uaWQ7XG4gICAgICBjb21wbGV0aW5nVGltZXIuY3VycmVudCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRDb21wbGV0aW5nKGZhbHNlKTtcbiAgICAgICAgLy8gTW92ZSBjYXJkIHRvIERvbmUgY29sdW1uIChvciBsYXN0IGNvbHVtbikgaW4gdGhlIHNhbWUgc3dpbWxhbmVcbiAgICAgICAgc3RhdGVNYW5hZ2VyLnNldFN0YXRlKChib2FyZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHN3aW1sYW5lSWR4ID0gY29sdW1uUGF0aFswXTtcbiAgICAgICAgICBjb25zdCBzd2ltbGFuZSA9IGJvYXJkLmNoaWxkcmVuW3N3aW1sYW5lSWR4XTtcbiAgICAgICAgICBpZiAoIXN3aW1sYW5lKSByZXR1cm4gYm9hcmQ7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBjYXJkJ3MgY3VycmVudCBsb2NhdGlvbiBieSBJRCAoaW5kZXggbWF5IGhhdmUgc2hpZnRlZClcbiAgICAgICAgICBsZXQgc291cmNlQ29sSWR4ID0gLTE7XG4gICAgICAgICAgbGV0IHNvdXJjZUl0ZW1JZHggPSAtMTtcbiAgICAgICAgICBmb3IgKGxldCBjaSA9IDA7IGNpIDwgc3dpbWxhbmUuY2hpbGRyZW4ubGVuZ3RoOyBjaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjb2wgPSBzd2ltbGFuZS5jaGlsZHJlbltjaV07XG4gICAgICAgICAgICBjb25zdCBpaSA9IGNvbC5jaGlsZHJlbi5maW5kSW5kZXgoKGM6IEl0ZW0pID0+IGMuaWQgPT09IGNhcmRJZCk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgIHNvdXJjZUNvbElkeCA9IGNpO1xuICAgICAgICAgICAgICBzb3VyY2VJdGVtSWR4ID0gaWk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc291cmNlQ29sSWR4ID09PSAtMSkgcmV0dXJuIGJvYXJkO1xuXG4gICAgICAgICAgbGV0IHRhcmdldENvbElkeCA9IHN3aW1sYW5lLmNoaWxkcmVuLmZpbmRJbmRleChcbiAgICAgICAgICAgIChjb2wpID0+IC9eZG9uZSQvaS50ZXN0KGNvbC5kYXRhLnRpdGxlKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHRhcmdldENvbElkeCA9PT0gLTEpIHRhcmdldENvbElkeCA9IHN3aW1sYW5lLmNoaWxkcmVuLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgICAvLyBEb24ndCBtb3ZlIGlmIGFscmVhZHkgaW4gdGhlIHRhcmdldCBjb2x1bW5cbiAgICAgICAgICBpZiAodGFyZ2V0Q29sSWR4ID09PSBzb3VyY2VDb2xJZHgpIHJldHVybiBib2FyZDtcblxuICAgICAgICAgIGNvbnN0IG1vdmVkSXRlbSA9IHN3aW1sYW5lLmNoaWxkcmVuW3NvdXJjZUNvbElkeF0uY2hpbGRyZW5bc291cmNlSXRlbUlkeF07XG5cbiAgICAgICAgICAvLyBSZW1vdmUgZnJvbSBzb3VyY2UgY29sdW1uLCB0aGVuIHB1c2ggaW50byB0YXJnZXQgY29sdW1uXG4gICAgICAgICAgY29uc3QgYWZ0ZXJSZW1vdmUgPSByZW1vdmVFbnRpdHkoYm9hcmQsIFtzd2ltbGFuZUlkeCwgc291cmNlQ29sSWR4LCBzb3VyY2VJdGVtSWR4XSk7XG4gICAgICAgICAgLy8gQWZ0ZXIgcmVtb3ZhbCwgYWRqdXN0IHRhcmdldCBpbmRleCBpZiBpdCB3YXMgYWZ0ZXIgdGhlIHNvdXJjZSBpbiB0aGUgc2FtZSBzd2ltbGFuZVxuICAgICAgICAgIC8vIChjb2x1bW4gaW5kaWNlcyBkb24ndCBzaGlmdCBzaW5jZSB3ZSdyZSByZW1vdmluZyBhbiBpdGVtLCBub3QgYSBjb2x1bW4pXG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZUVudGl0eShhZnRlclJlbW92ZSwgW3N3aW1sYW5lSWR4LCB0YXJnZXRDb2xJZHhdLCB7XG4gICAgICAgICAgICBjaGlsZHJlbjogeyAkcHVzaDogW21vdmVkSXRlbV0gfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LCAzMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVW5jaGVja2VkIGR1cmluZyBjb3VudGRvd24g4oCUIGNhbmNlbCBtb3ZlXG4gICAgICBpZiAoY29tcGxldGluZ1RpbWVyLmN1cnJlbnQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNvbXBsZXRpbmdUaW1lci5jdXJyZW50KTtcbiAgICAgICAgY29tcGxldGluZ1RpbWVyLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgICAgc2V0Q29tcGxldGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENsZWFudXAgdGltZXIgb24gdW5tb3VudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoY29tcGxldGluZ1RpbWVyLmN1cnJlbnQpIGNsZWFyVGltZW91dChjb21wbGV0aW5nVGltZXIuY3VycmVudCk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHByb21wdFNjb3JlID0gKCkgPT4ge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBpdGVtLmRhdGEuc2NvcmUgIT09IHVuZGVmaW5lZCA/IFN0cmluZyhpdGVtLmRhdGEuc2NvcmUpIDogJyc7XG4gICAgY29uc3QgbW9kYWwgPSBuZXcgSW5wdXRNb2RhbChcbiAgICAgIHN0YXRlTWFuYWdlci5hcHAsXG4gICAgICAnU2NvcmUgKDDigJMxMCwgbGVhdmUgYmxhbmsgdG8gY2xlYXIpOicsXG4gICAgICBjdXJyZW50LFxuICAgICAgKHZhbCkgPT4ge1xuICAgICAgICBpZiAodmFsID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2YWwudHJpbSgpO1xuICAgICAgICBpZiAoIXRyaW1tZWQpIHtcbiAgICAgICAgICBib2FyZE1vZGlmaWVycy51cGRhdGVJdGVtKGl0ZW1QYXRoLCB7IC4uLml0ZW0sIGRhdGE6IHsgLi4uaXRlbS5kYXRhLCBzY29yZTogdW5kZWZpbmVkIH0gfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KHRyaW1tZWQsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTihudW0pICYmIG51bSA+PSAwICYmIG51bSA8PSAxMCkge1xuICAgICAgICAgIGJvYXJkTW9kaWZpZXJzLnVwZGF0ZUl0ZW0oaXRlbVBhdGgsIHsgLi4uaXRlbSwgZGF0YTogeyAuLi5pdGVtLmRhdGEsIHNjb3JlOiBudW0gfSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgbW9kYWwub3BlbigpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUNvbnRleHRNZW51ID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICBpZiAoZWRpdGluZykgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuICAgIG1lbnUuYWRkSXRlbSgobWVudUl0ZW0pID0+IHtcbiAgICAgIG1lbnVJdGVtXG4gICAgICAgIC5zZXRUaXRsZSgnU2V0IHNjb3JlICgw4oCTMTApLi4uJylcbiAgICAgICAgLnNldEljb24oJ2x1Y2lkZS1nYXVnZScpXG4gICAgICAgIC5vbkNsaWNrKHByb21wdFNjb3JlKTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgobWVudUl0ZW0pID0+IHtcbiAgICAgIG1lbnVJdGVtXG4gICAgICAgIC5zZXRUaXRsZSgnU2V0IHByaW9yaXR5Li4uJylcbiAgICAgICAgLnNldEljb24oJ2x1Y2lkZS1zaWduYWwnKVxuICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgY29uc3QgY3VycmVudCA9IGl0ZW0uZGF0YS5wcmlvcml0eSB8fCAnJztcbiAgICAgICAgICBjb25zdCBtb2RhbCA9IG5ldyBJbnB1dE1vZGFsKFxuICAgICAgICAgICAgc3RhdGVNYW5hZ2VyLmFwcCxcbiAgICAgICAgICAgICdQcmlvcml0eSAoZS5nLiBQMCwgaGlnaCwgMSDigJQgbGVhdmUgYmxhbmsgdG8gY2xlYXIpOicsXG4gICAgICAgICAgICBjdXJyZW50LFxuICAgICAgICAgICAgKHZhbCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2YWwudHJpbSgpO1xuICAgICAgICAgICAgICBib2FyZE1vZGlmaWVycy51cGRhdGVJdGVtKGl0ZW1QYXRoLCB7XG4gICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICBkYXRhOiB7IC4uLml0ZW0uZGF0YSwgcHJpb3JpdHk6IHRyaW1tZWQgfHwgdW5kZWZpbmVkIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmIChpc1Byb2plY3QpIHtcbiAgICAgIG1lbnUuYWRkSXRlbSgobWVudUl0ZW0pID0+IHtcbiAgICAgICAgbWVudUl0ZW1cbiAgICAgICAgICAuc2V0VGl0bGUoJ1VuZ3JvdXAgY2FyZHMnKVxuICAgICAgICAgIC5zZXRJY29uKCdsdWNpZGUtdW5ncm91cCcpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4gYm9hcmRNb2RpZmllcnMudW5ncm91cEl0ZW1zKGl0ZW1QYXRoKSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBtZW51LmFkZEl0ZW0oKG1lbnVJdGVtKSA9PiB7XG4gICAgICBtZW51SXRlbVxuICAgICAgICAuc2V0VGl0bGUoJ0R1cGxpY2F0ZSBjYXJkJylcbiAgICAgICAgLnNldEljb24oJ2x1Y2lkZS1jb3B5JylcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIGJvYXJkTW9kaWZpZXJzLmluc2VydEl0ZW1zKFsuLi5jb2x1bW5QYXRoLCBpdGVtSW5kZXggKyAxXSwgW2RlZXBDbG9uZUl0ZW0oaXRlbSldKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKG1lbnVJdGVtKSA9PiB7XG4gICAgICBtZW51SXRlbVxuICAgICAgICAuc2V0VGl0bGUoJ1Byb21vdGUgdG8gc3dpbWxhbmUnKVxuICAgICAgICAuc2V0SWNvbignbHVjaWRlLWFycm93LXVwLWZyb20tbGluZScpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IGJvYXJkTW9kaWZpZXJzLnByb21vdGVUb1N3aW1sYW5lKGl0ZW1QYXRoKSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKG1lbnVJdGVtKSA9PiB7XG4gICAgICBtZW51SXRlbVxuICAgICAgICAuc2V0VGl0bGUoJ0RlbGV0ZSBjYXJkJylcbiAgICAgICAgLnNldEljb24oJ2x1Y2lkZS10cmFzaCcpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IGJvYXJkTW9kaWZpZXJzLmRlbGV0ZUVudGl0eShpdGVtUGF0aCkpO1xuICAgIH0pO1xuXG4gICAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGUpO1xuICB9O1xuXG4gIGNvbnN0IHRpdGxlQXJlYSA9IGVkaXRpbmcgPyAoXG4gICAgPD5cbiAgICAgIDx0ZXh0YXJlYVxuICAgICAgICByZWY9e3RleHRhcmVhUmVmfVxuICAgICAgICBjbGFzc05hbWU9e2MoJ2NhcmQtdGl0bGUtZWRpdG9yJyl9XG4gICAgICAgIHZhbHVlPXtlZGl0VmFsdWV9XG4gICAgICAgIG9uSW5wdXQ9eyhlKSA9PiB7XG4gICAgICAgICAgY29uc3QgZWwgPSBlLnRhcmdldCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICAgICAgICAgIHNldEVkaXRWYWx1ZShlbC52YWx1ZSk7XG4gICAgICAgICAgYXV0b1Jlc2l6ZShlbCk7XG4gICAgICAgIH19XG4gICAgICAgIG9uS2V5RG93bj17aGFuZGxlVGV4dGFyZWFLZXlEb3dufVxuICAgICAgICBvbkJsdXI9e2NvbW1pdEVkaXR9XG4gICAgICAgIGRhdGEtaWdub3JlLWRyYWdcbiAgICAgICAgcm93cz17MX1cbiAgICAgIC8+XG4gICAgICB7bGlua1N1Z2dlc3QgJiYgbGlua0FuY2hvciAmJiAoXG4gICAgICAgIDxXaWtpTGlua0Ryb3Bkb3duIHN1Z2dlc3Q9e2xpbmtTdWdnZXN0fSBhbmNob3I9e2xpbmtBbmNob3J9IGFjY2VwdD17YWNjZXB0TGlua30gY2xvc2U9eygpID0+IHt9fSAvPlxuICAgICAgKX1cbiAgICA8Lz5cbiAgKSA6IChcbiAgICA8c3BhblxuICAgICAgcmVmPXtzZXREcmFnSGFuZGxlfVxuICAgICAgY2xhc3NOYW1lPXtjKCdjYXJkLXRpdGxlJyl9XG4gICAgICBvbkRibENsaWNrPXtoYW5kbGVUaXRsZURibENsaWNrfVxuICAgID5cbiAgICAgIHtyZW5kZXJUaXRsZShcbiAgICAgICAgaXRlbS5kYXRhLnRpdGxlLFxuICAgICAgICB2aWV3Py5maWxlPy5wYXRoIHx8ICcnLFxuICAgICAgICAodGFyZ2V0KSA9PiBzdGF0ZU1hbmFnZXIuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQodGFyZ2V0LCB2aWV3Py5maWxlPy5wYXRoIHx8ICcnLCBmYWxzZSlcbiAgICAgICl9XG4gICAgPC9zcGFuPlxuICApO1xuXG4gIGNvbnN0IGNhcmRDb250ZW50ID0gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17ZWxlbWVudFJlZn1cbiAgICAgIGNsYXNzTmFtZT17XG4gICAgICAgIGMoJ2NhcmQnKSArXG4gICAgICAgIChpc1Byb2plY3QgPyBgICR7YygnY2FyZC0tcHJvamVjdCcpfWAgOiAnJykgK1xuICAgICAgICAoY29tcGxldGluZyA/IGAgJHtjKCdjYXJkLS1jb21wbGV0aW5nJyl9YCA6ICcnKVxuICAgICAgfVxuICAgICAgb25Db250ZXh0TWVudT17aGFuZGxlQ29udGV4dE1lbnV9XG4gICAgPlxuICAgICAge2NvbXBsZXRpbmcgJiYgPGRpdiBjbGFzc05hbWU9e2MoJ2NhcmQtY291bnRkb3duLWJhcicpfSAvPn1cbiAgICAgIHtzaG93TGVmdEFycm93ICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIGNsYXNzTmFtZT17YygnY2FyZC1tb3ZlLWJ0bicpICsgJyAnICsgYygnY2FyZC1tb3ZlLWJ0bi0tbGVmdCcpfVxuICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgYm9hcmRNb2RpZmllcnMubW92ZUl0ZW1Ub0NvbHVtbihpdGVtUGF0aCwgLTEpO1xuICAgICAgICAgIH19XG4gICAgICAgICAgb25Nb3VzZURvd249eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICAgIGRhdGEtaWdub3JlLWRyYWdcbiAgICAgICAgICB0aXRsZT1cIk1vdmUgdG8gcHJldmlvdXMgY29sdW1uXCJcbiAgICAgICAgPlxuICAgICAgICAgIOKXgFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgICA8aW5wdXRcbiAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgY2hlY2tlZD17aXRlbS5kYXRhLmNoZWNrZWR9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVDaGVja2JveENoYW5nZX1cbiAgICAgICAgY2xhc3NOYW1lPXtjKCdjYXJkLWNoZWNrYm94Jyl9XG4gICAgICAgIGRhdGEtaWdub3JlLWRyYWdcbiAgICAgIC8+XG4gICAgICB7dGl0bGVBcmVhfVxuICAgICAge2l0ZW0uZGF0YS5wcmlvcml0eSAmJiAoXG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YygnY2FyZC1wcmlvcml0eScpfT57aXRlbS5kYXRhLnByaW9yaXR5fTwvc3Bhbj5cbiAgICAgICl9XG4gICAgICB7aXRlbS5kYXRhLnNjb3JlICE9PSB1bmRlZmluZWQgPyAoXG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YygnY2FyZC1zY29yZScpfSBzdHlsZT17c2NvcmVTdHlsZXMoaXRlbS5kYXRhLnNjb3JlKX1cbiAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4geyBlLnN0b3BQcm9wYWdhdGlvbigpOyBwcm9tcHRTY29yZSgpOyB9fVxuICAgICAgICAgIG9uTW91c2VEb3duPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICBkYXRhLWlnbm9yZS1kcmFnXG4gICAgICAgID5cbiAgICAgICAgICB7aXRlbS5kYXRhLnNjb3JlfVxuICAgICAgICA8L3NwYW4+XG4gICAgICApIDogKFxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2MoJ2NhcmQtc2NvcmUnKSArICcgJyArIGMoJ2NhcmQtc2NvcmUtLW1pc3NpbmcnKX1cbiAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4geyBlLnN0b3BQcm9wYWdhdGlvbigpOyBwcm9tcHRTY29yZSgpOyB9fVxuICAgICAgICAgIG9uTW91c2VEb3duPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICBkYXRhLWlnbm9yZS1kcmFnXG4gICAgICAgID4tPC9zcGFuPlxuICAgICAgKX1cbiAgICAgIHtpc1Byb2plY3QgJiYgKFxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgY2xhc3NOYW1lPXtjKCdjYXJkLWNvbGxhcHNlLWJ0bicpfVxuICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgc2V0Q29sbGFwc2VkKCh2KSA9PiAhdik7XG4gICAgICAgICAgfX1cbiAgICAgICAgICBkYXRhLWlnbm9yZS1kcmFnXG4gICAgICAgICAgdGl0bGU9e2NvbGxhcHNlZCA/ICdFeHBhbmQgc3ViLWNhcmRzJyA6ICdDb2xsYXBzZSBzdWItY2FyZHMnfVxuICAgICAgICA+XG4gICAgICAgICAge2NvbGxhcHNlZCA/IGDilrYgJHtpdGVtLmNoaWxkcmVuLmxlbmd0aH1gIDogYOKWvCAke2l0ZW0uY2hpbGRyZW4ubGVuZ3RofWB9XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgKX1cbiAgICAgIHtzaG93UmlnaHRBcnJvdyAmJiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICBjbGFzc05hbWU9e2MoJ2NhcmQtbW92ZS1idG4nKSArICcgJyArIGMoJ2NhcmQtbW92ZS1idG4tLXJpZ2h0Jyl9XG4gICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBib2FyZE1vZGlmaWVycy5tb3ZlSXRlbVRvQ29sdW1uKGl0ZW1QYXRoLCAxKTtcbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uTW91c2VEb3duPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX1cbiAgICAgICAgICBkYXRhLWlnbm9yZS1kcmFnXG4gICAgICAgICAgdGl0bGU9XCJNb3ZlIHRvIG5leHQgY29sdW1uXCJcbiAgICAgICAgPlxuICAgICAgICAgIOKWtlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG5cbiAgY29uc3Qgc3ViSXRlbXMgPVxuICAgIGlzUHJvamVjdCAmJiAhY29sbGFwc2VkID8gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2MoJ2NhcmQtY2hpbGRyZW4nKX0+XG4gICAgICAgIHtpdGVtLmNoaWxkcmVuLm1hcCgoc3ViSXRlbSwgaSkgPT4gKFxuICAgICAgICAgIDxDYXJkXG4gICAgICAgICAgICBrZXk9e3N1Ykl0ZW0uaWR9XG4gICAgICAgICAgICBpdGVtPXtzdWJJdGVtIGFzIEl0ZW19XG4gICAgICAgICAgICBpdGVtSW5kZXg9e2l9XG4gICAgICAgICAgICBjb2x1bW5QYXRoPXtpdGVtUGF0aH1cbiAgICAgICAgICAvPlxuICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuICAgICkgOiBudWxsO1xuXG4gIGlmIChpc1N0YXRpYykge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17bWVhc3VyZVJlZn0+XG4gICAgICAgIHtjYXJkQ29udGVudH1cbiAgICAgICAge3N1Ykl0ZW1zfVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiByZWY9e21lYXN1cmVSZWZ9PlxuICAgICAgPERyb3BwYWJsZVxuICAgICAgICBlbGVtZW50UmVmPXtlbGVtZW50UmVmfVxuICAgICAgICBtZWFzdXJlUmVmPXttZWFzdXJlUmVmfVxuICAgICAgICBpZD17aXRlbS5pZH1cbiAgICAgICAgaW5kZXg9e2l0ZW1JbmRleH1cbiAgICAgICAgZGF0YT17ZGF0YX1cbiAgICAgID5cbiAgICAgICAge2NhcmRDb250ZW50fVxuICAgICAgICB7c3ViSXRlbXN9XG4gICAgICA8L0Ryb3BwYWJsZT5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==