import { SwimlaneKanbanView } from '../SwimlaneKanbanView';
import { StateManager } from '../StateManager';
import { Path } from '../dnd/types';
import update from 'immutability-helper';

import {
  appendEntities,
  buildUpdateParentMutation,
  getEntityFromPath,
  insertEntity,
  prependEntities,
  removeEntity,
  updateEntity,
  updateParentEntity,
} from '../dnd/util/data';
import {
  Board,
  Column,
  ColumnData,
  DataTypes,
  Item,
  SprintConfig,
  Swimlane,
  generateInstanceId,
} from '../types';

export interface BoardModifiers {
  appendItems: (path: Path, items: Item[]) => void;
  prependItems: (path: Path, items: Item[]) => void;
  insertItems: (path: Path, items: Item[]) => void;
  deleteEntity: (path: Path) => void;
  updateItem: (path: Path, item: Item) => void;
  addSwimlane: (swimlane: Swimlane) => void;
  addColumn: (swimlanePath: Path, column: Column) => void;
  updateColumn: (path: Path, column: Column) => void;
  updateColumnData: (path: Path, data: Partial<ColumnData>) => void;
  ungroupItems: (projectCardPath: Path) => void;
  promoteToSwimlane: (itemPath: Path) => void;
  demoteToCard: (swimlaneIndex: number) => void;
  moveSwimlane: (fromIndex: number, toIndex: number) => void;
  updateSprint: (sprint: SprintConfig | undefined) => void;
}

export function getBoardModifiers(
  view: SwimlaneKanbanView,
  stateManager: StateManager
): BoardModifiers {
  return {
    appendItems: (path: Path, items: Item[]) => {
      stateManager.setState((board) => appendEntities(board, path, items));
    },

    prependItems: (path: Path, items: Item[]) => {
      stateManager.setState((board) => prependEntities(board, path, items));
    },

    insertItems: (path: Path, items: Item[]) => {
      stateManager.setState((board) => insertEntity(board, path, items));
    },

    deleteEntity: (path: Path) => {
      stateManager.setState((board) => removeEntity(board, path));
    },

    updateItem: (path: Path, item: Item) => {
      stateManager.setState((board) =>
        updateParentEntity(board, path, {
          children: {
            [path[path.length - 1]]: { $set: item },
          },
        })
      );
    },

    addSwimlane: (swimlane: Swimlane) => {
      stateManager.setState((board) => appendEntities(board, [], [swimlane]));
    },

    addColumn: (swimlanePath: Path, column: Column) => {
      stateManager.setState((board) =>
        updateEntity(board, swimlanePath, { children: { $push: [column] } })
      );
    },

    updateColumn: (path: Path, column: Column) => {
      stateManager.setState((board) =>
        updateParentEntity(board, path, {
          children: {
            [path[path.length - 1]]: { $set: column },
          },
        })
      );
    },

    updateColumnData: (path: Path, data: Partial<ColumnData>) => {
      stateManager.setState((board) =>
        updateEntity(board, path, {
          data: { $merge: data },
        })
      );
    },

    ungroupItems: (projectCardPath: Path) => {
      stateManager.setState((board) => {
        const projectCard = getEntityFromPath(board, projectCardPath);
        if (!projectCard || projectCard.children.length === 0) return board;

        const cardIndex = projectCardPath[projectCardPath.length - 1];
        // Replace project card with its children in the parent's children array
        const spliceSpec = buildUpdateParentMutation(projectCardPath, {
          children: { $splice: [[cardIndex, 1, ...(projectCard.children as any[])]] },
        });
        return update(board, spliceSpec);
      });
    },

    promoteToSwimlane: (itemPath: Path) => {
      stateManager.setState((board) => {
        const card = getEntityFromPath(board, itemPath) as Item | undefined;
        if (!card) return board;

        const defaultColumns = stateManager.getSetting('default-columns') || [
          'To Do',
          'In Progress',
          'Done',
        ];
        const defaultWip = stateManager.getSetting('default-wip');

        const columns: Column[] = defaultColumns.map((title: string) => ({
          id: generateInstanceId(),
          type: DataTypes.Column,
          accepts: [DataTypes.Item],
          children: [] as Item[],
          data: { title, wipLimit: defaultWip },
        }));

        // Place the card's children (if any) into the first column
        if (card.children.length > 0) {
          columns[0].children = card.children.map((child) => ({
            ...(child as Item),
            id: generateInstanceId(),
          }));
        }

        const swimlane: Swimlane = {
          id: generateInstanceId(),
          type: DataTypes.Swimlane,
          accepts: [DataTypes.Column],
          children: columns,
          data: { title: card.data.title },
        };

        // Remove the card, then append the new swimlane
        const afterRemove = removeEntity(board, itemPath);
        return update(afterRemove, { children: { $push: [swimlane] } });
      });
    },

    demoteToCard: (swimlaneIndex: number) => {
      stateManager.setState((board) => {
        const swimlane = getEntityFromPath(board, [swimlaneIndex]) as Swimlane | undefined;
        if (!swimlane) return board;

        // Collect all items from all columns
        const allItems: Item[] = [];
        for (const col of swimlane.children) {
          for (const item of col.children) {
            allItems.push({ ...(item as Item), id: generateInstanceId() });
          }
        }

        // Create a project card with swimlane title; children = all collected items
        const card: Item = {
          id: generateInstanceId(),
          type: DataTypes.Item,
          accepts: [DataTypes.Item],
          children: allItems,
          data: { title: swimlane.data.title, checked: false },
        };

        // Find a target: previous swimlane, or next, first column
        let targetSwimlaneIdx = swimlaneIndex > 0 ? swimlaneIndex - 1 : swimlaneIndex + 1;
        if (targetSwimlaneIdx >= board.children.length || targetSwimlaneIdx < 0) {
          // Only one swimlane — can't demote
          return board;
        }

        const targetSwimlane = board.children[targetSwimlaneIdx];
        if (!targetSwimlane || targetSwimlane.children.length === 0) return board;

        // Remove the swimlane first
        const afterRemove = removeEntity(board, [swimlaneIndex]);

        // After removal, adjust target index if it was after the removed one
        const adjustedIdx = targetSwimlaneIdx > swimlaneIndex ? targetSwimlaneIdx - 1 : targetSwimlaneIdx;

        // Append card to first column of target swimlane
        return updateEntity(afterRemove, [adjustedIdx, 0], {
          children: { $push: [card] },
        });
      });
    },

    moveSwimlane: (fromIndex: number, toIndex: number) => {
      stateManager.setState((board) => {
        const total = board.children.length;
        if (fromIndex < 0 || fromIndex >= total || toIndex < 0 || toIndex >= total || fromIndex === toIndex) {
          return board;
        }
        const swimlane = board.children[fromIndex];
        const withoutFrom = update(board, { children: { $splice: [[fromIndex, 1]] } });
        return update(withoutFrom, { children: { $splice: [[toIndex, 0, swimlane]] } });
      });
    },

    updateSprint: (sprint: SprintConfig | undefined) => {
      stateManager.setState((board) =>
        update(board, { data: { sprint: { $set: sprint } } })
      );
    },
  };
}
