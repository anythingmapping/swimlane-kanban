import { Menu } from 'obsidian';
import { JSX } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/compat';

import { Droppable } from '../dnd/components/Droppable';
import { useDragHandle } from '../dnd/managers/DragManager';
import { removeEntity, updateEntity } from '../dnd/util/data';
import { EntityData } from '../dnd/types';
import { DataTypes, Item, generateInstanceId } from '../types';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';
import { InputModal } from './InputModal';
import { WikiLinkDropdown, useWikiLinkSuggest } from './WikiLinkSuggest';

interface CardProps {
  item: Item;
  itemIndex: number;
  columnPath: number[];
  isStatic?: boolean;
}

// 11-step blue palette: index = score value (0–10)
const SCORE_PALETTE: { bg: string; color: string }[] = [
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

export function scoreStyles(score: number): JSX.CSSProperties {
  const palette = SCORE_PALETTE[Math.max(0, Math.min(10, score))];
  return { backgroundColor: palette.bg, color: palette.color };
}

function deepCloneItem(item: Item): Item {
  return {
    ...item,
    id: generateInstanceId(),
    children: item.children.map((child) => deepCloneItem(child as Item)),
  };
}

// Render a title string, turning [[link]] and [[link|alias]] into clickable anchors
function renderTitle(
  title: string,
  sourcePath: string,
  openLink: (target: string) => void
): (JSX.Element | string)[] {
  const parts = title.split(/(\[\[[^\]]+\]\])/);
  return parts.map((part, i) => {
    const m = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
    if (m) {
      const target = m[1].trim();
      const display = m[2]?.trim() || target;
      return (
        <a
          key={i}
          class="internal-link"
          href={target}
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            openLink(target);
          }}
          onMouseDown={(e: MouseEvent) => e.stopPropagation()}
          data-ignore-drag
        >
          {display}
        </a>
      );
    }
    return part;
  });
}

export function Card({ item, itemIndex, columnPath, isStatic }: CardProps) {
  const { boardModifiers, view, stateManager } = useContext(SwimlaneKanbanContext);
  const itemPath = [...columnPath, itemIndex];
  const elementRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [completing, setCompleting] = useState(false);
  const completingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { suggest: linkSuggest, anchor: linkAnchor, accept: acceptLink, handleKeyDown: suggestKeyDown } =
    useWikiLinkSuggest(stateManager.app, editValue, setEditValue, textareaRef);

  const isProject = item.children.length > 0;
  const isTopLevel = columnPath.length === 2;

  // Column move arrows: only for top-level cards
  const swimlaneIdx = columnPath[0];
  const columnIdx = columnPath[1];
  const columnCount = isTopLevel
    ? (stateManager.state?.children?.[swimlaneIdx]?.children?.length ?? 0)
    : 0;
  const showLeftArrow = isTopLevel && columnIdx > 0;
  const showRightArrow = isTopLevel && columnIdx < columnCount - 1;

  const data = useMemo<EntityData>(
    () => ({
      id: item.id,
      type: DataTypes.Item,
      accepts: [DataTypes.Item],
      acceptsSort: isTopLevel ? [] : undefined,
      win: view?.getWindow?.() || window,
    }),
    [item.id, isTopLevel]
  );

  const setDragHandle = useDragHandle(measureRef, elementRef);

  // Focus and resize textarea when entering edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.setCssStyles({ height: 'auto' });
      el.setCssStyles({ height: el.scrollHeight + 'px' });
    }
  }, [editing]);

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.setCssStyles({ height: 'auto' });
    el.setCssStyles({ height: el.scrollHeight + 'px' });
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

  const handleTitleDblClick = (e: MouseEvent) => {
    e.preventDefault();
    setEditValue(item.data.title);
    setEditing(true);
  };

  const handleTextareaKeyDown = (e: KeyboardEvent) => {
    if (suggestKeyDown(e)) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
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
      completingTimer.current = activeWindow.setTimeout(() => {
        setCompleting(false);
        // Move card to Done column (or last column) in the same swimlane
        stateManager.setState((board) => {
          const swimlaneIdx = columnPath[0];
          const swimlane = board.children[swimlaneIdx];
          if (!swimlane) return board;

          // Find the card's current location by ID (index may have shifted)
          let sourceColIdx = -1;
          let sourceItemIdx = -1;
          for (let ci = 0; ci < swimlane.children.length; ci++) {
            const col = swimlane.children[ci];
            const ii = col.children.findIndex((c: Item) => c.id === cardId);
            if (ii !== -1) {
              sourceColIdx = ci;
              sourceItemIdx = ii;
              break;
            }
          }
          if (sourceColIdx === -1) return board;

          let targetColIdx = swimlane.children.findIndex(
            (col) => /^done$/i.test(col.data.title)
          );
          if (targetColIdx === -1) targetColIdx = swimlane.children.length - 1;

          // Don't move if already in the target column
          if (targetColIdx === sourceColIdx) return board;

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
    } else {
      // Unchecked during countdown — cancel move
      if (completingTimer.current) {
        activeWindow.clearTimeout(completingTimer.current);
        completingTimer.current = null;
      }
      setCompleting(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (completingTimer.current) activeWindow.clearTimeout(completingTimer.current);
    };
  }, []);

  const promptScore = () => {
    const current = item.data.score !== undefined ? String(item.data.score) : '';
    const modal = new InputModal(
      stateManager.app,
      'Score (0–10, leave blank to clear):',
      current,
      (val) => {
        if (val === null) return;
        const trimmed = val.trim();
        if (!trimmed) {
          boardModifiers.updateItem(itemPath, { ...item, data: { ...item.data, score: undefined } });
          return;
        }
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 0 && num <= 10) {
          boardModifiers.updateItem(itemPath, { ...item, data: { ...item.data, score: num } });
        }
      }
    );
    modal.open();
  };

  const handleContextMenu = (e: MouseEvent) => {
    if (editing) return;
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
          const modal = new InputModal(
            stateManager.app,
            'Priority (e.g. P0, high, 1 — leave blank to clear):',
            current,
            (val) => {
              if (val === null) return;
              const trimmed = val.trim();
              boardModifiers.updateItem(itemPath, {
                ...item,
                data: { ...item.data, priority: trimmed || undefined },
              });
            }
          );
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

  const titleArea = editing ? (
    <>
      <textarea
        ref={textareaRef}
        className={c('card-title-editor')}
        value={editValue}
        onInput={(e) => {
          const el = e.target as HTMLTextAreaElement;
          setEditValue(el.value);
          autoResize(el);
        }}
        onKeyDown={handleTextareaKeyDown}
        onBlur={commitEdit}
        data-ignore-drag
        rows={1}
      />
      {linkSuggest && linkAnchor && (
        <WikiLinkDropdown suggest={linkSuggest} anchor={linkAnchor} accept={acceptLink} close={() => {}} />
      )}
    </>
  ) : (
    <span
      ref={setDragHandle}
      className={c('card-title')}
      onDblClick={handleTitleDblClick}
    >
      {renderTitle(
        item.data.title,
        view?.file?.path || '',
        (target) => stateManager.app.workspace.openLinkText(target, view?.file?.path || '', false)
      )}
    </span>
  );

  const cardContent = (
    <div
      ref={elementRef}
      className={
        c('card') +
        (isProject ? ` ${c('card--project')}` : '') +
        (completing ? ` ${c('card--completing')}` : '')
      }
      onContextMenu={handleContextMenu}
    >
      {completing && <div className={c('card-countdown-bar')} />}
      {showLeftArrow && (
        <button
          className={c('card-move-btn') + ' ' + c('card-move-btn--left')}
          onClick={(e) => {
            e.stopPropagation();
            boardModifiers.moveItemToColumn(itemPath, -1);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          data-ignore-drag
          title="Move to previous column"
        >
          ◀
        </button>
      )}
      <input
        type="checkbox"
        checked={item.data.checked}
        onChange={handleCheckboxChange}
        className={c('card-checkbox')}
        data-ignore-drag
      />
      {titleArea}
      {item.data.priority && (
        <span className={c('card-priority')}>{item.data.priority}</span>
      )}
      {item.data.score !== undefined ? (
        <span className={c('card-score')} style={scoreStyles(item.data.score)}
          onClick={(e) => { e.stopPropagation(); promptScore(); }}
          onMouseDown={(e) => e.stopPropagation()}
          data-ignore-drag
        >
          {item.data.score}
        </span>
      ) : (
        <span className={c('card-score') + ' ' + c('card-score--missing')}
          onClick={(e) => { e.stopPropagation(); promptScore(); }}
          onMouseDown={(e) => e.stopPropagation()}
          data-ignore-drag
        >-</span>
      )}
      {isProject && (
        <button
          className={c('card-collapse-btn')}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((v) => !v);
          }}
          data-ignore-drag
          title={collapsed ? 'Expand sub-cards' : 'Collapse sub-cards'}
        >
          {collapsed ? `▶ ${item.children.length}` : `▼ ${item.children.length}`}
        </button>
      )}
      {showRightArrow && (
        <button
          className={c('card-move-btn') + ' ' + c('card-move-btn--right')}
          onClick={(e) => {
            e.stopPropagation();
            boardModifiers.moveItemToColumn(itemPath, 1);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          data-ignore-drag
          title="Move to next column"
        >
          ▶
        </button>
      )}
    </div>
  );

  const subItems =
    isProject && !collapsed ? (
      <div className={c('card-children')}>
        {item.children.map((subItem, i) => (
          <Card
            key={subItem.id}
            item={subItem as Item}
            itemIndex={i}
            columnPath={itemPath}
          />
        ))}
      </div>
    ) : null;

  if (isStatic) {
    return (
      <div ref={measureRef}>
        {cardContent}
        {subItems}
      </div>
    );
  }

  return (
    <div ref={measureRef}>
      <Droppable
        elementRef={elementRef}
        measureRef={measureRef}
        id={item.id}
        index={itemIndex}
        data={data}
      >
        {cardContent}
        {subItems}
      </Droppable>
    </div>
  );
}
