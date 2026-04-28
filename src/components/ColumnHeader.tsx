import classcat from 'classcat';
import { Menu } from 'obsidian';
import { useContext } from 'preact/compat';

import { updateEntity } from '../dnd/util/data';
import { Board, ColumnData } from '../types';
import { InputModal } from './InputModal';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';

interface ColumnHeaderProps {
  data: ColumnData;
  itemCount: number;
  columnPath: number[];
  dragHandleRef?: (el: HTMLElement) => void;
}

export function ColumnHeader({ data, itemCount, columnPath, dragHandleRef }: ColumnHeaderProps) {
  const { boardModifiers, stateManager } = useContext(SwimlaneKanbanContext);
  const { title, wipLimit } = data;
  const atLimit = wipLimit !== undefined && itemCount >= wipLimit;
  const overLimit = wipLimit !== undefined && itemCount > wipLimit;

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const menu = new Menu();

    menu.addItem((item) => {
      item
        .setTitle('Set wip limit...')
        .setIcon('lucide-alert-circle')
        .onClick(() => {
          const modal = new InputModal(
            stateManager.app,
            'WIP limit (leave empty to remove):',
            wipLimit?.toString() || '',
            (input) => {
              if (input === null) return;
              const parsed = parseInt(input, 10);
              const newWip = isNaN(parsed) || input.trim() === '' ? undefined : parsed;
              boardModifiers.updateColumnData(columnPath, { wipLimit: newWip });
            }
          );
          modal.open();
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('Rename column...')
        .setIcon('lucide-edit')
        .onClick(() => {
          const modal = new InputModal(
            stateManager.app,
            'Column name:',
            title,
            (input) => {
              if (input === null || input.trim() === '') return;
              boardModifiers.updateColumnData(columnPath, { title: input.trim() });
            }
          );
          modal.open();
        });
    });

    if (itemCount > 0) {
      menu.addItem((item) => {
        item
          .setTitle('Delete all cards')
          .setIcon('lucide-eraser')
          .onClick(() => {
            stateManager.setState((board: Board) =>
              updateEntity(board, columnPath, { children: { $set: [] } })
            );
          });
      });
    }

    menu.addItem((item) => {
      item
        .setTitle('Delete column')
        .setIcon('lucide-trash')
        .onClick(() => {
          boardModifiers.deleteEntity(columnPath);
        });
    });

    menu.showAtMouseEvent(e);
  };

  return (
    <div
      className={classcat([
        c('column-header'),
        { [c('wip-at')]: atLimit && !overLimit, [c('wip-over')]: overLimit },
      ])}
      onContextMenu={handleContextMenu}
    >
      <div className={c('column-header-row')}>
        {dragHandleRef && (
          <span ref={dragHandleRef} className={c('column-drag-handle')} title="Drag to reorder">⠿</span>
        )}
        <span className={c('column-title')}>{title}</span>
        <span className={c('wip-badge')}>
          {wipLimit !== undefined ? `${itemCount}/${wipLimit}` : itemCount}
        </span>
      </div>
      {wipLimit !== undefined && (
        <div className={c('wip-bar-track')}>
          <div
            className={c('wip-bar-fill')}
            style={{ width: `${Math.min(100, (itemCount / wipLimit) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
