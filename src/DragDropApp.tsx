import { CSSProperties, JSX, createPortal, memo, useCallback, useMemo } from 'preact/compat';

import { SwimlaneKanbanView } from './SwimlaneKanbanView';
import { Board } from './components/Board';
import { SwimlaneKanbanContext } from './components/context';
import { scoreStyles } from './components/Card';
import { DndContext } from './dnd/components/DndContext';
import { DragOverlay } from './dnd/components/DragOverlay';
import { Entity } from './dnd/types';
import {
  getEntityFromPath,
  insertEntity,
  moveEntity,
  removeEntity,
} from './dnd/util/data';
import { getBoardModifiers } from './helpers/boardModifiers';
import SwimlaneKanbanPlugin from './main';
import { DataTypes } from './types';

export function createApp(win: Window, plugin: SwimlaneKanbanPlugin) {
  return <DragDropApp win={win} plugin={plugin} />;
}

const View = memo(function View({ view }: { view: SwimlaneKanbanView }) {
  return createPortal(view.getPortal(), view.contentEl);
});

function DragOverlayContent({
  entity,
  styles,
  plugin,
}: {
  entity: Entity;
  styles: CSSProperties;
  plugin: SwimlaneKanbanPlugin;
}) {
  const data = useMemo(() => {
    const overlayData = entity.getData();
    const view = plugin.getSwimlaneKanbanView(entity.scopeId, overlayData.win);
    if (!view) return null;
    const stateManager = plugin.stateManagers.get(view.file);
    return getEntityFromPath(stateManager.state, entity.getPath());
  }, [entity]);

  if (!data) return <div />;

  if (data.type === DataTypes.Item) {
    return (
      <div className="swimlane-kanban__drag-container" style={styles}>
        <div className="swimlane-kanban__card">
          <span className="swimlane-kanban__card-title">{data.data.title}</span>
          {data.data.score !== undefined && (
            <span className="swimlane-kanban__card-score" style={scoreStyles(data.data.score)}>
              {data.data.score}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (data.type === DataTypes.Column) {
    return (
      <div className="swimlane-kanban__drag-container" style={styles}>
        <div className="swimlane-kanban__column swimlane-kanban__column--dragging">
          <div className="swimlane-kanban__column-header">
            <div className="swimlane-kanban__column-header-row">
              <span className="swimlane-kanban__column-title">{data.data.title}</span>
              {data.data.wipLimit !== undefined && (
                <span className="swimlane-kanban__wip-badge">{data.data.wipLimit}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div />;
}

export function DragDropApp({ win, plugin }: { win: Window; plugin: SwimlaneKanbanPlugin }) {
  const views = plugin.useSwimlaneKanbanViews(win);
  const portals: JSX.Element[] = views.map((view) => <View key={view.id} view={view} />);

  const handleDrop = useCallback(
    (dragEntity: Entity, dropEntity: Entity) => {
      if (!dragEntity || !dropEntity) return;

      const dragPath = dragEntity.getPath();
      const dropPath = dropEntity.getPath();
      const dragEntityData = dragEntity.getData();
      const dropEntityData = dropEntity.getData();
      const [, sourceFile] = dragEntity.scopeId.split(':::');
      const [, destinationFile] = dropEntity.scopeId.split(':::');

      const inDropArea =
        dropEntityData.acceptsSort && !dropEntityData.acceptsSort.includes(dragEntityData.type);

      // Same board
      if (sourceFile === destinationFile) {
        const view = plugin.getSwimlaneKanbanView(dragEntity.scopeId, dragEntityData.win);
        const stateManager = plugin.stateManagers.get(view.file);

        if (inDropArea) {
          const targetEntity = getEntityFromPath(stateManager.state, dropPath);
          dropPath.push(targetEntity.children.length);
        }

        return stateManager.setState((board) => {
          return moveEntity(board, dragPath, dropPath);
        });
      }

      // Cross-board (simplified)
      const sourceView = plugin.getSwimlaneKanbanView(dragEntity.scopeId, dragEntityData.win);
      const sourceStateManager = plugin.stateManagers.get(sourceView.file);
      const destinationView = plugin.getSwimlaneKanbanView(dropEntity.scopeId, dropEntityData.win);
      const destinationStateManager = plugin.stateManagers.get(destinationView.file);

      sourceStateManager.setState((sourceBoard) => {
        const entity = getEntityFromPath(sourceBoard, dragPath);

        destinationStateManager.setState((destinationBoard) => {
          if (inDropArea) {
            const parent = getEntityFromPath(destinationBoard, dropPath);
            dropPath.push(parent.children.length);
          }
          return insertEntity(destinationBoard, dropPath, [entity]);
        });

        return removeEntity(sourceBoard, dragPath);
      });
    },
    [views]
  );

  if (portals.length) {
    return (
      <DndContext win={win} onDrop={handleDrop}>
        {...portals}
        <DragOverlay>
          {(entity, styles) => <DragOverlayContent entity={entity} styles={styles} plugin={plugin} />}
        </DragOverlay>
      </DndContext>
    );
  }

  return null;
}
