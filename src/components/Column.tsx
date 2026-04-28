import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/compat';

import { Droppable } from '../dnd/components/Droppable';
import { useDragHandle } from '../dnd/managers/DragManager';
import { ScrollContainer } from '../dnd/components/ScrollContainer';
import { Sortable } from '../dnd/components/Sortable';
import { SortPlaceholder } from '../dnd/components/SortPlaceholder';
import { updateEntity } from '../dnd/util/data';
import { EntityData } from '../dnd/types';
import { Board, Column as ColumnType, DataTypes, Item } from '../types';
import { Card } from './Card';
import { CardForm } from './CardForm';
import { ColumnHeader } from './ColumnHeader';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';

const COLUMN_TRIGGER_TYPES = [DataTypes.Item];
const MIN_COLUMN_WIDTH = 180;
const PAGE_SIZE = 3;

function getEffectiveScore(item: Item): number {
  const selfScore = item.data.score ?? -1;
  if (item.children.length === 0) return selfScore;
  const childMax = Math.max(...item.children.map((c: Item) => c.data.score ?? -1));
  return Math.max(selfScore, childMax);
}

interface SortedItem {
  item: Item;
  originalIndex: number;
}

function sortByScore(items: Item[]): SortedItem[] {
  return items
    .map((item, i) => ({ item, originalIndex: i }))
    .sort((a, b) => getEffectiveScore(b.item) - getEffectiveScore(a.item));
}

interface ColumnProps {
  column: ColumnType;
  columnIndex: number;
  swimlaneIndex: number;
}

export function Column({ column, columnIndex, swimlaneIndex }: ColumnProps) {
  const { view, stateManager, boardModifiers } = useContext(SwimlaneKanbanContext);
  const columnPath = [swimlaneIndex, columnIndex];
  const elementRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const setDragHandle = useDragHandle(measureRef, elementRef);

  // Column width: use persisted value from column data, fall back to CSS variable
  const persistedWidth = column.data.width;
  const widthStyle = persistedWidth
    ? { flex: `0 0 ${persistedWidth}px`, minWidth: `${persistedWidth}px` }
    : undefined;

  const onResizePointerDown = useCallback((e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startWidth = measureRef.current?.getBoundingClientRect().width ?? 272;
    activeDocument.body.classList.add('swimlane-kanban--resizing');

    const onMove = (ev: PointerEvent) => {
      const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + (ev.clientX - startX)));
      if (measureRef.current) {
        measureRef.current.setCssStyles({ flex: `0 0 ${newWidth}px`, minWidth: `${newWidth}px` });
      }
    };

    const onUp = (ev: PointerEvent) => {
      activeDocument.body.classList.remove('swimlane-kanban--resizing');
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      const finalWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + (ev.clientX - startX)));
      boardModifiers.updateColumnData(columnPath, { width: finalWidth });
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  }, [columnPath, boardModifiers]);

  const onResizeDblClick = useCallback(() => {
    boardModifiers.updateColumnData(columnPath, { width: undefined });
  }, [columnPath, boardModifiers]);

  const [startIndex, setStartIndex] = useState(0);
  const [clearedItems, setClearedItems] = useState<Item[]>([]);

  const handleClear = () => {
    setClearedItems(column.children);
    stateManager.setState((board: Board) => {
      return updateEntity(board, [swimlaneIndex, columnIndex], { children: { $set: [] } });
    });
  };

  const handleUnclear = () => {
    stateManager.setState((board: Board) => {
      return updateEntity(board, [swimlaneIndex, columnIndex], { children: { $set: clearedItems } });
    });
    setClearedItems([]);
  };

  // Reset pagination when children change
  const childCount = column.children.length;
  useEffect(() => {
    setStartIndex(0);
  }, [childCount]);

  const sortedCards = useMemo(() => sortByScore(column.children), [column.children]);

  const needsPagination = sortedCards.length > PAGE_SIZE;
  const clampedStart = Math.min(startIndex, Math.max(0, sortedCards.length - PAGE_SIZE));
  const visibleCards = needsPagination
    ? sortedCards.slice(clampedStart, clampedStart + PAGE_SIZE)
    : sortedCards;

  const remaining = sortedCards.length - clampedStart - PAGE_SIZE;

  const data = useMemo<EntityData>(
    () => ({
      id: column.id,
      type: DataTypes.Column,
      accepts: [],
      win: view?.getWindow?.() || window,
    }),
    [column.id]
  );

  return (
    <div
      ref={measureRef}
      className={c('column')}
      style={widthStyle}
    >
      <Droppable
        elementRef={elementRef}
        measureRef={measureRef}
        id={column.id}
        index={columnIndex}
        data={data}
      >
        <div ref={elementRef} className={c('column-inner')}>
          <ColumnHeader data={column.data} itemCount={column.children.length} columnPath={columnPath} dragHandleRef={setDragHandle} />
          <Sortable axis="vertical">
            <ScrollContainer
              id={column.id}
              className={c('column-items')}
              triggerTypes={COLUMN_TRIGGER_TYPES}
            >
              {needsPagination && clampedStart > 0 && (
                <button
                  className={c('column-pagination')}
                  onClick={() => setStartIndex(Math.max(0, clampedStart - 1))}
                >
                  ▲ {clampedStart}
                </button>
              )}
              {visibleCards.map((sorted) => (
                <Card
                  key={sorted.item.id}
                  item={sorted.item}
                  itemIndex={sorted.originalIndex}
                  columnPath={columnPath}
                />
              ))}
              {needsPagination && remaining > 0 && (
                <button
                  className={c('column-pagination')}
                  onClick={() => setStartIndex(clampedStart + 1)}
                >
                  ▼ {remaining}
                </button>
              )}
              <SortPlaceholder
                index={column.children.length}
                accepts={[DataTypes.Item]}
                className={c('sort-placeholder')}
              />
            </ScrollContainer>
          </Sortable>
          <CardForm columnPath={columnPath} />
          {column.children.length > 0 && (
            <button
              className={c('column-clear')}
              onClick={handleClear}
              title="Clear all cards from this column"
              data-ignore-drag
            >
              CLEAR
            </button>
          )}
          {clearedItems.length > 0 && (
            <button
              className={c('column-unclear')}
              onClick={handleUnclear}
              title="Undo clear and restore cards back to this column"
              data-ignore-drag
            >
              UNCLEAR
            </button>
          )}
        </div>
      </Droppable>
      <div
        className={c('column-resize-handle')}
        onPointerDown={onResizePointerDown}
        onDblClick={onResizeDblClick}
      />
    </div>
  );
}
