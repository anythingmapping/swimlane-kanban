import boxIntersect from 'box-intersect';
import { useCallback, useContext, useRef } from 'preact/compat';
import { DndManagerContext } from '../components/context';
import { rafThrottle } from '../util/animation';
import { createHTMLDndEntity } from '../util/createHTMLDndEntity';
import { adjustHitboxForMovement, distanceBetween, getBestIntersect, getScrollIntersection, } from '../util/hitbox';
export class DragManager {
    constructor(win, emitter, hitboxEntities, scrollEntities) {
        this.isHTMLDragging = false;
        this.dragOverTimeout = 0;
        this.win = win;
        this.hitboxEntities = hitboxEntities;
        this.scrollEntities = scrollEntities;
        this.emitter = emitter;
    }
    getDragEventData() {
        return {
            dragEntity: this.dragEntity,
            dragEntityId: this.dragEntityId,
            dragEntityMargin: this.dragEntityMargin,
            dragOrigin: this.dragOrigin,
            dragOriginHitbox: this.dragOriginHitbox,
            dragPosition: this.dragPosition,
            primaryIntersection: this.primaryIntersection,
            scrollIntersection: this.scrollIntersection,
        };
    }
    dragStart(e, referenceElement) {
        var _a;
        const id = (referenceElement === null || referenceElement === void 0 ? void 0 : referenceElement.dataset.hitboxid) || e.currentTarget.dataset.hitboxid;
        if (!id)
            return;
        const styles = getComputedStyle(referenceElement || e.currentTarget);
        // Recalculate all hitboxes so targets are accurate after layout shifts
        this.hitboxEntities.forEach((entity) => entity.recalcInitial());
        this.dragEntityId = id;
        this.dragOrigin = { x: e.pageX, y: e.pageY };
        this.dragPosition = { x: e.pageX, y: e.pageY };
        this.dragEntity = this.hitboxEntities.get(id);
        this.dragOriginHitbox = (_a = this.dragEntity) === null || _a === void 0 ? void 0 : _a.getHitbox();
        this.dragEntityMargin = [
            parseFloat(styles.marginLeft) || 0,
            parseFloat(styles.marginTop) || 0,
            parseFloat(styles.marginRight) || 0,
            parseFloat(styles.marginBottom) || 0,
        ];
        this.emitter.emit('dragStart', this.getDragEventData());
    }
    dragStartHTML(e, viewId) {
        this.isHTMLDragging = true;
        const entity = createHTMLDndEntity(e.pageX, e.pageY, [], viewId, e.view);
        this.dragEntityId = entity.entityId;
        this.dragOrigin = { x: e.pageX, y: e.pageY };
        this.dragPosition = { x: e.pageX, y: e.pageY };
        this.dragEntity = entity;
        this.dragOriginHitbox = entity.getHitbox();
        this.dragEntityMargin = [0, 0, 0, 0];
        this.emitter.emit('dragStart', this.getDragEventData());
    }
    dragMove(e) {
        this.dragPosition = { x: e.pageX, y: e.pageY };
        this.emitter.emit('dragMove', this.getDragEventData());
        this.calculateDragIntersect();
    }
    dragMoveHTML(e) {
        this.dragPosition = { x: e.pageX, y: e.pageY };
        this.emitter.emit('dragMove', this.getDragEventData());
        this.calculateDragIntersect();
    }
    dragEnd(_e) {
        this.emitter.emit('dragEnd', this.getDragEventData());
        this.dragEntityMargin = undefined;
        this.dragEntity = undefined;
        this.dragEntityId = undefined;
        this.dragOrigin = undefined;
        this.dragOriginHitbox = undefined;
        this.dragPosition = undefined;
        this.scrollIntersection = undefined;
        this.primaryIntersection = undefined;
    }
    dragEndHTML(e, viewId, content, isLeave) {
        this.isHTMLDragging = false;
        if (!isLeave) {
            this.dragEntity = createHTMLDndEntity(e.pageX, e.pageY, content, viewId, e.view);
            this.emitter.emit('dragEnd', this.getDragEventData());
        }
        this.dragEntityMargin = undefined;
        this.dragEntity = undefined;
        this.dragEntityId = undefined;
        this.dragOrigin = undefined;
        this.dragOriginHitbox = undefined;
        this.dragPosition = undefined;
        this.scrollIntersection = undefined;
        this.primaryIntersection = undefined;
        if (isLeave) {
            this.emitter.emit('dragEnd', this.getDragEventData());
        }
    }
    onHTMLDragLeave(callback) {
        this.win.clearTimeout(this.dragOverTimeout);
        this.dragOverTimeout = this.win.setTimeout(callback, 351);
    }
    calculateDragIntersect() {
        if (!this.dragEntity || !this.dragPosition || !this.dragOrigin || !this.dragOriginHitbox) {
            return;
        }
        const { type, win } = this.dragEntity.getData();
        const hitboxEntities = [];
        const hitboxHitboxes = [];
        const scrollEntities = [];
        const scrollHitboxes = [];
        this.hitboxEntities.forEach((entity) => {
            var _a;
            const data = entity.getData();
            if (win === data.win && (data.accepts.includes(type) || ((_a = data.acceptsSort) === null || _a === void 0 ? void 0 : _a.includes(type)))) {
                hitboxEntities.push(entity);
                hitboxHitboxes.push(entity.getHitbox());
            }
        });
        this.scrollEntities.forEach((entity) => {
            const data = entity.getData();
            if (win === data.win && data.accepts.includes(type)) {
                scrollEntities.push(entity);
                scrollHitboxes.push(entity.getHitbox());
            }
        });
        if (hitboxEntities.length === 0 && scrollEntities.length === 0) {
            return;
        }
        const dragHitbox = adjustHitboxForMovement(this.dragOriginHitbox, this.dragOrigin, this.dragPosition);
        const isScrolling = this.handleScrollIntersect(dragHitbox, this.dragEntity, scrollHitboxes, scrollEntities);
        if (!isScrolling) {
            this.handleHitboxIntersect(dragHitbox, this.dragEntity, hitboxHitboxes, hitboxEntities);
        }
    }
    handleScrollIntersect(dragHitbox, dragEntity, hitboxes, hitboxEntities) {
        const scrollHits = boxIntersect([dragHitbox], hitboxes).map((match) => hitboxEntities[match[1]]);
        const scrollIntersection = getScrollIntersection(scrollHits, dragHitbox, dragEntity);
        if (this.scrollIntersection &&
            (!scrollIntersection || scrollIntersection[0] !== this.scrollIntersection[0])) {
            const [scrollEntity, scrollStrength] = this.scrollIntersection;
            const scrollEntityData = scrollEntity.getData();
            const scrollEntityId = scrollEntity.entityId;
            const scrollEntitySide = scrollEntityData.side;
            this.emitter.emit('endDragScroll', {
                ...this.getDragEventData(),
                scrollEntity,
                scrollEntityId,
                scrollEntitySide,
                scrollStrength,
            }, scrollEntityId);
            this.scrollIntersection = undefined;
        }
        if (scrollIntersection &&
            (!this.scrollIntersection || this.scrollIntersection[0] !== scrollIntersection[0])) {
            const [scrollEntity, scrollStrength] = scrollIntersection;
            const scrollEntityData = scrollEntity.getData();
            const scrollEntityId = scrollEntity.entityId;
            const scrollEntitySide = scrollEntityData.side;
            this.emitter.emit('beginDragScroll', {
                ...this.getDragEventData(),
                scrollEntity,
                scrollEntityId,
                scrollEntitySide,
                scrollStrength,
            }, scrollEntityId);
            this.scrollIntersection = scrollIntersection;
        }
        else if (scrollIntersection &&
            this.scrollIntersection &&
            scrollIntersection[0] === this.scrollIntersection[0]) {
            const [scrollEntity, scrollStrength] = scrollIntersection;
            const scrollEntityData = scrollEntity.getData();
            const scrollEntityId = scrollEntity.entityId;
            const scrollEntitySide = scrollEntityData.side;
            this.emitter.emit('updateDragScroll', {
                ...this.getDragEventData(),
                scrollEntity,
                scrollEntityId,
                scrollEntitySide,
                scrollStrength,
            }, scrollEntityId);
            this.scrollIntersection = scrollIntersection;
        }
        return !!scrollIntersection;
    }
    handleHitboxIntersect(dragHitbox, dragEntity, hitboxes, hitboxEntities) {
        const hits = boxIntersect([dragHitbox], hitboxes).map((match) => hitboxEntities[match[1]]);
        const primaryIntersection = getBestIntersect(hits, dragHitbox, dragEntity);
        if (this.primaryIntersection && this.primaryIntersection !== primaryIntersection) {
            this.emitter.emit('dragLeave', this.getDragEventData(), this.primaryIntersection.entityId);
            this.primaryIntersection = undefined;
        }
        if (primaryIntersection && this.primaryIntersection !== primaryIntersection) {
            this.emitter.emit('dragEnter', {
                ...this.getDragEventData(),
                primaryIntersection,
            }, primaryIntersection.entityId);
            this.primaryIntersection = primaryIntersection;
        }
    }
}
const cancelEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
};
export function useDragHandle(droppableElement, handleElement) {
    const dndManager = useContext(DndManagerContext);
    const unbind = useRef(() => { });
    return useCallback((el) => {
        if (handleElement.current !== el) {
            unbind.current();
            unbind.current = () => { };
        }
        if (!el)
            return;
        const handle = el;
        const onPointerDown = (e) => {
            if (e.defaultPrevented || !dndManager || !droppableElement.current)
                return;
            const droppable = droppableElement.current;
            let node = e.targetNode;
            while (node) {
                if (node.instanceOf(HTMLElement) && node.dataset.ignoreDrag) {
                    return;
                }
                node = node.parentElement;
            }
            // We only care about left mouse / touch contact
            // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#determining_button_states
            if (e.button !== 0 && e.buttons !== 1) {
                return;
            }
            const win = e.view;
            const isTouchEvent = ['pen', 'touch'].includes(e.pointerType);
            const pointerId = e.pointerId;
            if (!isTouchEvent) {
                e.stopPropagation();
                e.preventDefault();
            }
            const initialEvent = e;
            const initialPosition = {
                x: e.pageX,
                y: e.pageY,
            };
            let isDragging = false;
            let longPressTimeout = 0;
            if (isTouchEvent) {
                win.addEventListener('contextmenu', cancelEvent, true);
                longPressTimeout = win.setTimeout(() => {
                    dndManager.dragManager.dragStart(initialEvent, droppable);
                    isDragging = true;
                    win.addEventListener('touchmove', cancelEvent, {
                        passive: false,
                    });
                }, 500);
            }
            // RAF-throttle only the dragMove calls for performance.
            // The 5px threshold check runs on every pointermove so fast clicks
            // are never missed between frames.
            const rafDragMove = rafThrottle(win, (e) => {
                dndManager.dragManager.dragMove(e);
            });
            const onMove = (e) => {
                if (e.pointerId !== pointerId)
                    return;
                if (isTouchEvent) {
                    if (!isDragging) {
                        if (distanceBetween(initialPosition, {
                            x: e.pageX,
                            y: e.pageY,
                        }) > 5) {
                            win.clearTimeout(longPressTimeout);
                            win.removeEventListener('touchmove', cancelEvent);
                            win.removeEventListener('contextmenu', cancelEvent, true);
                            win.removeEventListener('pointermove', onMove);
                            win.removeEventListener('pointerup', onEnd);
                            win.removeEventListener('pointercancel', onEnd);
                        }
                    }
                    else {
                        rafDragMove(e);
                    }
                }
                else {
                    if (!isDragging) {
                        if (distanceBetween(initialPosition, {
                            x: e.pageX,
                            y: e.pageY,
                        }) > 5) {
                            dndManager.dragManager.dragStart(initialEvent, droppable);
                            isDragging = true;
                        }
                    }
                    else {
                        rafDragMove(e);
                    }
                }
            };
            const onEnd = (e) => {
                if (e.pointerId !== pointerId)
                    return;
                win.clearTimeout(longPressTimeout);
                rafDragMove.cancel();
                isDragging = false;
                dndManager.dragManager.dragEnd(e);
                win.removeEventListener('pointermove', onMove);
                win.removeEventListener('pointerup', onEnd);
                win.removeEventListener('pointercancel', onEnd);
                if (isTouchEvent) {
                    win.removeEventListener('contextmenu', cancelEvent, true);
                    win.removeEventListener('touchmove', cancelEvent);
                }
            };
            win.addEventListener('pointermove', onMove);
            win.addEventListener('pointerup', onEnd);
            win.addEventListener('pointercancel', onEnd);
        };
        const swallowTouchEvent = (e) => {
            e.stopPropagation();
        };
        handle.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('touchstart', swallowTouchEvent);
        unbind.current = () => {
            handle.removeEventListener('pointerdown', onPointerDown);
            handle.removeEventListener('touchstart', swallowTouchEvent);
        };
    }, []);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHJhZ01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEcmFnTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksTUFBTSxlQUFlLENBQUM7QUFFekMsT0FBTyxFQUFhLFdBQVcsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRTFELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNsRSxPQUFPLEVBQ0wsdUJBQXVCLEVBQ3ZCLGVBQWUsRUFDZixnQkFBZ0IsRUFDaEIscUJBQXFCLEdBQ3RCLE1BQU0sZ0JBQWdCLENBQUM7QUFvQnhCLE1BQU0sT0FBTyxXQUFXO0lBbUJ0QixZQUNFLEdBQVcsRUFDWCxPQUFxQixFQUNyQixjQUFtQyxFQUNuQyxjQUFtQztRQVByQyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUNoQyxvQkFBZSxHQUFXLENBQUMsQ0FBQztRQVExQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxnQkFBZ0I7UUFDZCxPQUFPO1lBQ0wsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQzNCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtZQUMvQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3ZDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3ZDLFlBQVksRUFBRSxJQUFJLENB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QztRQUN0RCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFFekQsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDcEIsTUFBTSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBib3hJbnRlcnNlY3QgZnJvbSAnYm94LWludGVyc2VjdCc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0IHsgUmVmT2JqZWN0LCB1c2VDYWxsYmFjaywgdXNlQ29udGV4dCwgdXNlUmVmIH0gZnJvbSAncHJlYWN0L2NvbXBhdCc7XG5cbmltcG9ydCB7IERuZE1hbmFnZXJDb250ZXh0IH0gZnJvbSAnLi4vY29tcG9uZW50cy9jb250ZXh0JztcbmltcG9ydCB7IENvb3JkaW5hdGVzLCBFbnRpdHksIEhpdGJveCwgU2lkZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHJhZlRocm90dGxlIH0gZnJvbSAnLi4vdXRpbC9hbmltYXRpb24nO1xuaW1wb3J0IHsgY3JlYXRlSFRNTERuZEVudGl0eSB9IGZyb20gJy4uL3V0aWwvY3JlYXRlSFRNTERuZEVudGl0eSc7XG5pbXBvcnQge1xuICBhZGp1c3RIaXRib3hGb3JNb3ZlbWVudCxcbiAgZGlzdGFuY2VCZXR3ZWVuLFxuICBnZXRCZXN0SW50ZXJzZWN0LFxuICBnZXRTY3JvbGxJbnRlcnNlY3Rpb24sXG59IGZyb20gJy4uL3V0aWwvaGl0Ym94JztcblxuZXhwb3J0IGludGVyZmFjZSBEcmFnRXZlbnREYXRhIHtcbiAgZHJhZ0VudGl0eT86IEVudGl0eTtcbiAgZHJhZ0VudGl0eUlkPzogc3RyaW5nO1xuICBkcmFnRW50aXR5TWFyZ2luPzogSGl0Ym94O1xuICBkcmFnT3JpZ2luPzogQ29vcmRpbmF0ZXM7XG4gIGRyYWdPcmlnaW5IaXRib3g/OiBIaXRib3g7XG4gIGRyYWdQb3NpdGlvbj86IENvb3JkaW5hdGVzO1xuICBwcmltYXJ5SW50ZXJzZWN0aW9uPzogRW50aXR5O1xuICBzY3JvbGxJbnRlcnNlY3Rpb25zPzogW0VudGl0eSwgbnVtYmVyXVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjcm9sbEV2ZW50RGF0YSBleHRlbmRzIERyYWdFdmVudERhdGEge1xuICBzY3JvbGxFbnRpdHk6IEVudGl0eTtcbiAgc2Nyb2xsRW50aXR5SWQ6IHN0cmluZztcbiAgc2Nyb2xsRW50aXR5U2lkZTogU2lkZTtcbiAgc2Nyb2xsU3RyZW5ndGg6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIERyYWdNYW5hZ2VyIHtcbiAgd2luOiBXaW5kb3c7XG4gIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcjtcbiAgaGl0Ym94RW50aXRpZXM6IE1hcDxzdHJpbmcsIEVudGl0eT47XG4gIHNjcm9sbEVudGl0aWVzOiBNYXA8c3RyaW5nLCBFbnRpdHk+O1xuXG4gIGRyYWdFbnRpdHk/OiBFbnRpdHk7XG4gIGRyYWdFbnRpdHlJZD86IHN0cmluZztcbiAgZHJhZ0VudGl0eU1hcmdpbj86IEhpdGJveDtcbiAgZHJhZ09yaWdpbj86IENvb3JkaW5hdGVzO1xuICBkcmFnT3JpZ2luSGl0Ym94PzogSGl0Ym94O1xuICBkcmFnUG9zaXRpb24/OiBDb29yZGluYXRlcztcblxuICBwcmltYXJ5SW50ZXJzZWN0aW9uPzogRW50aXR5O1xuICBzY3JvbGxJbnRlcnNlY3Rpb24/OiBbRW50aXR5LCBudW1iZXJdO1xuXG4gIGlzSFRNTERyYWdnaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIGRyYWdPdmVyVGltZW91dDogbnVtYmVyID0gMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICB3aW46IFdpbmRvdyxcbiAgICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gICAgaGl0Ym94RW50aXRpZXM6IE1hcDxzdHJpbmcsIEVudGl0eT4sXG4gICAgc2Nyb2xsRW50aXRpZXM6IE1hcDxzdHJpbmcsIEVudGl0eT5cbiAgKSB7XG4gICAgdGhpcy53aW4gPSB3aW47XG4gICAgdGhpcy5oaXRib3hFbnRpdGllcyA9IGhpdGJveEVudGl0aWVzO1xuICAgIHRoaXMuc2Nyb2xsRW50aXRpZXMgPSBzY3JvbGxFbnRpdGllcztcbiAgICB0aGlzLmVtaXR0ZXIgPSBlbWl0dGVyO1xuICB9XG5cbiAgZ2V0RHJhZ0V2ZW50RGF0YSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZHJhZ0VudGl0eTogdGhpcy5kcmFnRW50aXR5LFxuICAgICAgZHJhZ0VudGl0eUlkOiB0aGlzLmRyYWdFbnRpdHlJZCxcbiAgICAgIGRyYWdFbnRpdHlNYXJnaW46IHRoaXMuZHJhZ0VudGl0eU1hcmdpbixcbiAgICAgIGRyYWdPcmlnaW46IHRoaXMuZHJhZ09yaWdpbixcbiAgICAgIGRyYWdPcmlnaW5IaXRib3g6IHRoaXMuZHJhZ09yaWdpbkhpdGJveCxcbiAgICAgIGRyYWdQb3NpdGlvbjogdGhpcy5kcmFnUG9zaXRpb24sXG4gICAgICBwcmltYXJ5SW50ZXJzZWN0aW9uOiB0aGlzLnByaW1hcnlJbnRlcnNlY3Rpb24sXG4gICAgICBzY3JvbGxJbnRlcnNlY3Rpb246IHRoaXMuc2Nyb2xsSW50ZXJzZWN0aW9uLFxuICAgIH07XG4gIH1cblxuICBkcmFnU3RhcnQoZTogUG9pbnRlckV2ZW50LCByZWZlcmVuY2VFbGVtZW50PzogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBpZCA9XG4gICAgICByZWZlcmVuY2VFbGVtZW50Py5kYXRhc2V0LmhpdGJveGlkIHx8IChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpLmRhdGFzZXQuaGl0Ym94aWQ7XG5cbiAgICBpZiAoIWlkKSByZXR1cm47XG5cbiAgICBjb25zdCBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKHJlZmVyZW5jZUVsZW1lbnQgfHwgKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCkpO1xuXG4gICAgLy8gUmVjYWxjdWxhdGUgYWxsIGhpdGJveGVzIHNvIHRhcmdldHMgYXJlIGFjY3VyYXRlIGFmdGVyIGxheW91dCBzaGlmdHNcbiAgICB0aGlzLmhpdGJveEVudGl0aWVzLmZvckVhY2goKGVudGl0eSkgPT4gZW50aXR5LnJlY2FsY0luaXRpYWwoKSk7XG5cbiAgICB0aGlzLmRyYWdFbnRpdHlJZCA9IGlkO1xuICAgIHRoaXMuZHJhZ09yaWdpbiA9IHsgeDogZS5wYWdlWCwgeTogZS5wYWdlWSB9O1xuICAgIHRoaXMuZHJhZ1Bvc2l0aW9uID0geyB4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZIH07XG4gICAgdGhpcy5kcmFnRW50aXR5ID0gdGhpcy5oaXRib3hFbnRpdGllcy5nZXQoaWQpO1xuICAgIHRoaXMuZHJhZ09yaWdpbkhpdGJveCA9IHRoaXMuZHJhZ0VudGl0eT8uZ2V0SGl0Ym94KCk7XG4gICAgdGhpcy5kcmFnRW50aXR5TWFyZ2luID0gW1xuICAgICAgcGFyc2VGbG9hdChzdHlsZXMubWFyZ2luTGVmdCkgfHwgMCxcbiAgICAgIHBhcnNlRmxvYXQoc3R5bGVzLm1hcmdpblRvcCkgfHwgMCxcbiAgICAgIHBhcnNlRmxvYXQoc3R5bGVzLm1hcmdpblJpZ2h0KSB8fCAwLFxuICAgICAgcGFyc2VGbG9hdChzdHlsZXMubWFyZ2luQm90dG9tKSB8fCAwLFxuICAgIF07XG5cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZHJhZ1N0YXJ0JywgdGhpcy5nZXREcmFnRXZlbnREYXRhKCkpO1xuICB9XG5cbiAgZHJhZ1N0YXJ0SFRNTChlOiBEcmFnRXZlbnQsIHZpZXdJZDogc3RyaW5nKSB7XG4gICAgdGhpcy5pc0hUTUxEcmFnZ2luZyA9IHRydWU7XG4gICAgY29uc3QgZW50aXR5ID0gY3JlYXRlSFRNTERuZEVudGl0eShlLnBhZ2VYLCBlLnBhZ2VZLCBbXSwgdmlld0lkLCBlLnZpZXcpO1xuXG4gICAgdGhpcy5kcmFnRW50aXR5SWQgPSBlbnRpdHkuZW50aXR5SWQ7XG4gICAgdGhpcy5kcmFnT3JpZ2luID0geyB4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZIH07XG4gICAgdGhpcy5kcmFnUG9zaXRpb24gPSB7IHg6IGUucGFnZVgsIHk6IGUucGFnZVkgfTtcbiAgICB0aGlzLmRyYWdFbnRpdHkgPSBlbnRpdHk7XG4gICAgdGhpcy5kcmFnT3JpZ2luSGl0Ym94ID0gZW50aXR5LmdldEhpdGJveCgpO1xuICAgIHRoaXMuZHJhZ0VudGl0eU1hcmdpbiA9IFswLCAwLCAwLCAwXTtcblxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkcmFnU3RhcnQnLCB0aGlzLmdldERyYWdFdmVudERhdGEoKSk7XG4gIH1cblxuICBkcmFnTW92ZShlOiBQb2ludGVyRXZlbnQpIHtcbiAgICB0aGlzLmRyYWdQb3NpdGlvbiA9IHsgeDogZS5wYWdlWCwgeTogZS5wYWdlWSB9O1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkcmFnTW92ZScsIHRoaXMuZ2V0RHJhZ0V2ZW50RGF0YSgpKTtcbiAgICB0aGlzLmNhbGN1bGF0ZURyYWdJbnRlcnNlY3QoKTtcbiAgfVxuXG4gIGRyYWdNb3ZlSFRNTChlOiBEcmFnRXZlbnQpIHtcbiAgICB0aGlzLmRyYWdQb3NpdGlvbiA9IHsgeDogZS5wYWdlWCwgeTogZS5wYWdlWSB9O1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkcmFnTW92ZScsIHRoaXMuZ2V0RHJhZ0V2ZW50RGF0YSgpKTtcbiAgICB0aGlzLmNhbGN1bGF0ZURyYWdJbnRlcnNlY3QoKTtcbiAgfVxuXG4gIGRyYWdFbmQoX2U6IFBvaW50ZXJFdmVudCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkcmFnRW5kJywgdGhpcy5nZXREcmFnRXZlbnREYXRhKCkpO1xuICAgIHRoaXMuZHJhZ0VudGl0eU1hcmdpbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRyYWdFbnRpdHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kcmFnRW50aXR5SWQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kcmFnT3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZHJhZ09yaWdpbkhpdGJveCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRyYWdQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnNjcm9sbEludGVyc2VjdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnByaW1hcnlJbnRlcnNlY3Rpb24gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBkcmFnRW5kSFRNTChlOiBEcmFnRXZlbnQsIHZpZXdJZDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmdbXSwgaXNMZWF2ZT86IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzSFRNTERyYWdnaW5nID0gZmFsc2U7XG4gICAgaWYgKCFpc0xlYXZlKSB7XG4gICAgICB0aGlzLmRyYWdFbnRpdHkgPSBjcmVhdGVIVE1MRG5kRW50aXR5KGUucGFnZVgsIGUucGFnZVksIGNvbnRlbnQsIHZpZXdJZCwgZS52aWV3KTtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkcmFnRW5kJywgdGhpcy5nZXREcmFnRXZlbnREYXRhKCkpO1xuICAgIH1cblxuICAgIHRoaXMuZHJhZ0VudGl0eU1hcmdpbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRyYWdFbnRpdHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kcmFnRW50aXR5SWQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kcmFnT3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZHJhZ09yaWdpbkhpdGJveCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRyYWdQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnNjcm9sbEludGVyc2VjdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnByaW1hcnlJbnRlcnNlY3Rpb24gPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNMZWF2ZSkge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RyYWdFbmQnLCB0aGlzLmdldERyYWdFdmVudERhdGEoKSk7XG4gICAgfVxuICB9XG5cbiAgb25IVE1MRHJhZ0xlYXZlKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy53aW4uY2xlYXJUaW1lb3V0KHRoaXMuZHJhZ092ZXJUaW1lb3V0KTtcbiAgICB0aGlzLmRyYWdPdmVyVGltZW91dCA9IHRoaXMud2luLnNldFRpbWVvdXQoY2FsbGJhY2ssIDM1MSk7XG4gIH1cblxuICBjYWxjdWxhdGVEcmFnSW50ZXJzZWN0KCkge1xuICAgIGlmICghdGhpcy5kcmFnRW50aXR5IHx8ICF0aGlzLmRyYWdQb3NpdGlvbiB8fCAhdGhpcy5kcmFnT3JpZ2luIHx8ICF0aGlzLmRyYWdPcmlnaW5IaXRib3gpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7IHR5cGUsIHdpbiB9ID0gdGhpcy5kcmFnRW50aXR5LmdldERhdGEoKTtcblxuICAgIGNvbnN0IGhpdGJveEVudGl0aWVzOiBFbnRpdHlbXSA9IFtdO1xuICAgIGNvbnN0IGhpdGJveEhpdGJveGVzOiBIaXRib3hbXSA9IFtdO1xuICAgIGNvbnN0IHNjcm9sbEVudGl0aWVzOiBFbnRpdHlbXSA9IFtdO1xuICAgIGNvbnN0IHNjcm9sbEhpdGJveGVzOiBIaXRib3hbXSA9IFtdO1xuXG4gICAgdGhpcy5oaXRib3hFbnRpdGllcy5mb3JFYWNoKChlbnRpdHkpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBlbnRpdHkuZ2V0RGF0YSgpO1xuXG4gICAgICBpZiAod2luID09PSBkYXRhLndpbiAmJiAoZGF0YS5hY2NlcHRzLmluY2x1ZGVzKHR5cGUpIHx8IGRhdGEuYWNjZXB0c1NvcnQ/LmluY2x1ZGVzKHR5cGUpKSkge1xuICAgICAgICBoaXRib3hFbnRpdGllcy5wdXNoKGVudGl0eSk7XG4gICAgICAgIGhpdGJveEhpdGJveGVzLnB1c2goZW50aXR5LmdldEhpdGJveCgpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuc2Nyb2xsRW50aXRpZXMuZm9yRWFjaCgoZW50aXR5KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gZW50aXR5LmdldERhdGEoKTtcblxuICAgICAgaWYgKHdpbiA9PT0gZGF0YS53aW4gJiYgZGF0YS5hY2NlcHRzLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgIHNjcm9sbEVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgICAgICAgc2Nyb2xsSGl0Ym94ZXMucHVzaChlbnRpdHkuZ2V0SGl0Ym94KCkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGhpdGJveEVudGl0aWVzLmxlbmd0aCA9PT0gMCAmJiBzY3JvbGxFbnRpdGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkcmFnSGl0Ym94ID0gYWRqdXN0SGl0Ym94Rm9yTW92ZW1lbnQoXG4gICAgICB0aGlzLmRyYWdPcmlnaW5IaXRib3gsXG4gICAgICB0aGlzLmRyYWdPcmlnaW4sXG4gICAgICB0aGlzLmRyYWdQb3NpdGlvblxuICAgICk7XG5cbiAgICBjb25zdCBpc1Njcm9sbGluZyA9IHRoaXMuaGFuZGxlU2Nyb2xsSW50ZXJzZWN0KFxuICAgICAgZHJhZ0hpdGJveCxcbiAgICAgIHRoaXMuZHJhZ0VudGl0eSxcbiAgICAgIHNjcm9sbEhpdGJveGVzLFxuICAgICAgc2Nyb2xsRW50aXRpZXNcbiAgICApO1xuXG4gICAgaWYgKCFpc1Njcm9sbGluZykge1xuICAgICAgdGhpcy5oYW5kbGVIaXRib3hJbnRlcnNlY3QoZHJhZ0hpdGJveCwgdGhpcy5kcmFnRW50aXR5LCBoaXRib3hIaXRib3hlcywgaGl0Ym94RW50aXRpZXMpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVNjcm9sbEludGVyc2VjdChcbiAgICBkcmFnSGl0Ym94OiBIaXRib3gsXG4gICAgZHJhZ0VudGl0eTogRW50aXR5LFxuICAgIGhpdGJveGVzOiBIaXRib3hbXSxcbiAgICBoaXRib3hFbnRpdGllczogRW50aXR5W11cbiAgKSB7XG4gICAgY29uc3Qgc2Nyb2xsSGl0czogRW50aXR5W10gPSBib3hJbnRlcnNlY3QoW2RyYWdIaXRib3hdLCBoaXRib3hlcykubWFwKFxuICAgICAgKG1hdGNoOiBudW1iZXJbXSkgPT4gaGl0Ym94RW50aXRpZXNbbWF0Y2hbMV1dXG4gICAgKTtcblxuICAgIGNvbnN0IHNjcm9sbEludGVyc2VjdGlvbiA9IGdldFNjcm9sbEludGVyc2VjdGlvbihzY3JvbGxIaXRzLCBkcmFnSGl0Ym94LCBkcmFnRW50aXR5KTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMuc2Nyb2xsSW50ZXJzZWN0aW9uICYmXG4gICAgICAoIXNjcm9sbEludGVyc2VjdGlvbiB8fCBzY3JvbGxJbnRlcnNlY3Rpb25bMF0gIT09IHRoaXMuc2Nyb2xsSW50ZXJzZWN0aW9uWzBdKVxuICAgICkge1xuICAgICAgY29uc3QgW3Njcm9sbEVudGl0eSwgc2Nyb2xsU3RyZW5ndGhdID0gdGhpcy5zY3JvbGxJbnRlcnNlY3Rpb247XG4gICAgICBjb25zdCBzY3JvbGxFbnRpdHlEYXRhID0gc2Nyb2xsRW50aXR5LmdldERhdGEoKTtcbiAgICAgIGNvbnN0IHNjcm9sbEVudGl0eUlkID0gc2Nyb2xsRW50aXR5LmVudGl0eUlkO1xuICAgICAgY29uc3Qgc2Nyb2xsRW50aXR5U2lkZSA9IHNjcm9sbEVudGl0eURhdGEuc2lkZTtcblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoXG4gICAgICAgICdlbmREcmFnU2Nyb2xsJyxcbiAgICAgICAge1xuICAgICAgICAgIC4uLnRoaXMuZ2V0RHJhZ0V2ZW50RGF0YSgpLFxuICAgICAgICAgIHNjcm9sbEVudGl0eSxcbiAgICAgICAgICBzY3JvbGxFbnRpdHlJZCxcbiAgICAgICAgICBzY3JvbGxFbnRpdHlTaWRlLFxuICAgICAgICAgIHNjcm9sbFN0cmVuZ3RoLFxuICAgICAgICB9LFxuICAgICAgICBzY3JvbGxFbnRpdHlJZFxuICAgICAgKTtcblxuICAgICAgdGhpcy5zY3JvbGxJbnRlcnNlY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgc2Nyb2xsSW50ZXJzZWN0aW9uICYmXG4gICAgICAoIXRoaXMuc2Nyb2xsSW50ZXJzZWN0aW9uIHx8IHRoaXMuc2Nyb2xsSW50ZXJzZWN0aW9uWzBdICE9PSBzY3JvbGxJbnRlcnNlY3Rpb25bMF0pXG4gICAgKSB7XG4gICAgICBjb25zdCBbc2Nyb2xsRW50aXR5LCBzY3JvbGxTdHJlbmd0aF0gPSBzY3JvbGxJbnRlcnNlY3Rpb247XG4gICAgICBjb25zdCBzY3JvbGxFbnRpdHlEYXRhID0gc2Nyb2xsRW50aXR5LmdldERhdGEoKTtcbiAgICAgIGNvbnN0IHNjcm9sbEVudGl0eUlkID0gc2Nyb2xsRW50aXR5LmVudGl0eUlkO1xuICAgICAgY29uc3Qgc2Nyb2xsRW50aXR5U2lkZSA9IHNjcm9sbEVudGl0eURhdGEuc2lkZTtcblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoXG4gICAgICAgICdiZWdpbkRyYWdTY3JvbGwnLFxuICAgICAgICB7XG4gICAgICAgICAgLi4udGhpcy5nZXREcmFnRXZlbnREYXRhKCksXG4gICAgICAgICAgc2Nyb2xsRW50aXR5LFxuICAgICAgICAgIHNjcm9sbEVudGl0eUlkLFxuICAgICAgICAgIHNjcm9sbEVudGl0eVNpZGUsXG4gICAgICAgICAgc2Nyb2xsU3RyZW5ndGgsXG4gICAgICAgIH0sXG4gICAgICAgIHNjcm9sbEVudGl0eUlkXG4gICAgICApO1xuXG4gICAgICB0aGlzLnNjcm9sbEludGVyc2VjdGlvbiA9IHNjcm9sbEludGVyc2VjdGlvbjtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgc2Nyb2xsSW50ZXJzZWN0aW9uICYmXG4gICAgICB0aGlzLnNjcm9sbEludGVyc2VjdGlvbiAmJlxuICAgICAgc2Nyb2xsSW50ZXJzZWN0aW9uWzBdID09PSB0aGlzLnNjcm9sbEludGVyc2VjdGlvblswXVxuICAgICkge1xuICAgICAgY29uc3QgW3Njcm9sbEVudGl0eSwgc2Nyb2xsU3RyZW5ndGhdID0gc2Nyb2xsSW50ZXJzZWN0aW9uO1xuICAgICAgY29uc3Qgc2Nyb2xsRW50aXR5RGF0YSA9IHNjcm9sbEVudGl0eS5nZXREYXRhKCk7XG4gICAgICBjb25zdCBzY3JvbGxFbnRpdHlJZCA9IHNjcm9sbEVudGl0eS5lbnRpdHlJZDtcbiAgICAgIGNvbnN0IHNjcm9sbEVudGl0eVNpZGUgPSBzY3JvbGxFbnRpdHlEYXRhLnNpZGU7XG5cbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFxuICAgICAgICAndXBkYXRlRHJhZ1Njcm9sbCcsXG4gICAgICAgIHtcbiAgICAgICAgICAuLi50aGlzLmdldERyYWdFdmVudERhdGEoKSxcbiAgICAgICAgICBzY3JvbGxFbnRpdHksXG4gICAgICAgICAgc2Nyb2xsRW50aXR5SWQsXG4gICAgICAgICAgc2Nyb2xsRW50aXR5U2lkZSxcbiAgICAgICAgICBzY3JvbGxTdHJlbmd0aCxcbiAgICAgICAgfSxcbiAgICAgICAgc2Nyb2xsRW50aXR5SWRcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuc2Nyb2xsSW50ZXJzZWN0aW9uID0gc2Nyb2xsSW50ZXJzZWN0aW9uO1xuICAgIH1cblxuICAgIHJldHVybiAhIXNjcm9sbEludGVyc2VjdGlvbjtcbiAgfVxuXG4gIGhhbmRsZUhpdGJveEludGVyc2VjdChcbiAgICBkcmFnSGl0Ym94OiBIaXRib3gsXG4gICAgZHJhZ0VudGl0eTogRW50aXR5LFxuICAgIGhpdGJveGVzOiBIaXRib3hbXSxcbiAgICBoaXRib3hFbnRpdGllczogRW50aXR5W11cbiAgKSB7XG4gICAgY29uc3QgaGl0czogRW50aXR5W10gPSBib3hJbnRlcnNlY3QoW2RyYWdIaXRib3hdLCBoaXRib3hlcykubWFwKFxuICAgICAgKG1hdGNoOiBudW1iZXJbXSkgPT4gaGl0Ym94RW50aXRpZXNbbWF0Y2hbMV1dXG4gICAgKTtcblxuICAgIGNvbnN0IHByaW1hcnlJbnRlcnNlY3Rpb24gPSBnZXRCZXN0SW50ZXJzZWN0KGhpdHMsIGRyYWdIaXRib3gsIGRyYWdFbnRpdHkpO1xuXG4gICAgaWYgKHRoaXMucHJpbWFyeUludGVyc2VjdGlvbiAmJiB0aGlzLnByaW1hcnlJbnRlcnNlY3Rpb24gIT09IHByaW1hcnlJbnRlcnNlY3Rpb24pIHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkcmFnTGVhdmUnLCB0aGlzLmdldERyYWdFdmVudERhdGEoKSwgdGhpcy5wcmltYXJ5SW50ZXJzZWN0aW9uLmVudGl0eUlkKTtcbiAgICAgIHRoaXMucHJpbWFyeUludGVyc2VjdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAocHJpbWFyeUludGVyc2VjdGlvbiAmJiB0aGlzLnByaW1hcnlJbnRlcnNlY3Rpb24gIT09IHByaW1hcnlJbnRlcnNlY3Rpb24pIHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFxuICAgICAgICAnZHJhZ0VudGVyJyxcbiAgICAgICAge1xuICAgICAgICAgIC4uLnRoaXMuZ2V0RHJhZ0V2ZW50RGF0YSgpLFxuICAgICAgICAgIHByaW1hcnlJbnRlcnNlY3Rpb24sXG4gICAgICAgIH0sXG4gICAgICAgIHByaW1hcnlJbnRlcnNlY3Rpb24uZW50aXR5SWRcbiAgICAgICk7XG4gICAgICB0aGlzLnByaW1hcnlJbnRlcnNlY3Rpb24gPSBwcmltYXJ5SW50ZXJzZWN0aW9uO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBjYW5jZWxFdmVudCA9IChlOiBUb3VjaEV2ZW50KSA9PiB7XG4gIGUucHJldmVudERlZmF1bHQoKTtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VEcmFnSGFuZGxlKFxuICBkcm9wcGFibGVFbGVtZW50OiBSZWZPYmplY3Q8SFRNTEVsZW1lbnQgfCBudWxsPixcbiAgaGFuZGxlRWxlbWVudDogUmVmT2JqZWN0PEhUTUxFbGVtZW50IHwgbnVsbD5cbikge1xuICBjb25zdCBkbmRNYW5hZ2VyID0gdXNlQ29udGV4dChEbmRNYW5hZ2VyQ29udGV4dCk7XG4gIGNvbnN0IHVuYmluZCA9IHVzZVJlZigoKSA9PiB7fSk7XG5cbiAgcmV0dXJuIHVzZUNhbGxiYWNrKChlbDogSFRNTEVsZW1lbnQpID0+IHtcbiAgICBpZiAoaGFuZGxlRWxlbWVudC5jdXJyZW50ICE9PSBlbCkge1xuICAgICAgdW5iaW5kLmN1cnJlbnQoKTtcbiAgICAgIHVuYmluZC5jdXJyZW50ID0gKCkgPT4ge307XG4gICAgfVxuICAgIGlmICghZWwpIHJldHVybjtcblxuICAgIGNvbnN0IGhhbmRsZSA9IGVsO1xuICAgIGNvbnN0IG9uUG9pbnRlckRvd24gPSAoZTogUG9pbnRlckV2ZW50KSA9PiB7XG4gICAgICBpZiAoZS5kZWZhdWx0UHJldmVudGVkIHx8ICFkbmRNYW5hZ2VyIHx8ICFkcm9wcGFibGVFbGVtZW50LmN1cnJlbnQpIHJldHVybjtcbiAgICAgIGNvbnN0IGRyb3BwYWJsZSA9IGRyb3BwYWJsZUVsZW1lbnQuY3VycmVudDtcblxuICAgICAgbGV0IG5vZGUgPSBlLnRhcmdldE5vZGU7XG4gICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5pbnN0YW5jZU9mKEhUTUxFbGVtZW50KSAmJiBub2RlLmRhdGFzZXQuaWdub3JlRHJhZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBvbmx5IGNhcmUgYWJvdXQgbGVmdCBtb3VzZSAvIHRvdWNoIGNvbnRhY3RcbiAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Qb2ludGVyX2V2ZW50cyNkZXRlcm1pbmluZ19idXR0b25fc3RhdGVzXG4gICAgICBpZiAoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b25zICE9PSAxKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd2luID0gZS52aWV3O1xuICAgICAgY29uc3QgaXNUb3VjaEV2ZW50ID0gWydwZW4nLCAndG91Y2gnXS5pbmNsdWRlcyhlLnBvaW50ZXJUeXBlKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJJZCA9IGUucG9pbnRlcklkO1xuXG4gICAgICBpZiAoIWlzVG91Y2hFdmVudCkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluaXRpYWxFdmVudCA9IGU7XG4gICAgICBjb25zdCBpbml0aWFsUG9zaXRpb246IENvb3JkaW5hdGVzID0ge1xuICAgICAgICB4OiBlLnBhZ2VYLFxuICAgICAgICB5OiBlLnBhZ2VZLFxuICAgICAgfTtcblxuICAgICAgbGV0IGlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgIGxldCBsb25nUHJlc3NUaW1lb3V0ID0gMDtcblxuICAgICAgaWYgKGlzVG91Y2hFdmVudCkge1xuICAgICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBjYW5jZWxFdmVudCwgdHJ1ZSk7XG5cbiAgICAgICAgbG9uZ1ByZXNzVGltZW91dCA9IHdpbi5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBkbmRNYW5hZ2VyLmRyYWdNYW5hZ2VyLmRyYWdTdGFydChpbml0aWFsRXZlbnQsIGRyb3BwYWJsZSk7XG4gICAgICAgICAgaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGNhbmNlbEV2ZW50LCB7XG4gICAgICAgICAgICBwYXNzaXZlOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gUkFGLXRocm90dGxlIG9ubHkgdGhlIGRyYWdNb3ZlIGNhbGxzIGZvciBwZXJmb3JtYW5jZS5cbiAgICAgIC8vIFRoZSA1cHggdGhyZXNob2xkIGNoZWNrIHJ1bnMgb24gZXZlcnkgcG9pbnRlcm1vdmUgc28gZmFzdCBjbGlja3NcbiAgICAgIC8vIGFyZSBuZXZlciBtaXNzZWQgYmV0d2VlbiBmcmFtZXMuXG4gICAgICBjb25zdCByYWZEcmFnTW92ZSA9IHJhZlRocm90dGxlKHdpbiwgKGU6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgICAgICBkbmRNYW5hZ2VyLmRyYWdNYW5hZ2VyLmRyYWdNb3ZlKGUpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG9uTW92ZSA9IChlOiBQb2ludGVyRXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGUucG9pbnRlcklkICE9PSBwb2ludGVySWQpIHJldHVybjtcbiAgICAgICAgaWYgKGlzVG91Y2hFdmVudCkge1xuICAgICAgICAgIGlmICghaXNEcmFnZ2luZykge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBkaXN0YW5jZUJldHdlZW4oaW5pdGlhbFBvc2l0aW9uLCB7XG4gICAgICAgICAgICAgICAgeDogZS5wYWdlWCxcbiAgICAgICAgICAgICAgICB5OiBlLnBhZ2VZLFxuICAgICAgICAgICAgICB9KSA+IDVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB3aW4uY2xlYXJUaW1lb3V0KGxvbmdQcmVzc1RpbWVvdXQpO1xuICAgICAgICAgICAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgY2FuY2VsRXZlbnQpO1xuICAgICAgICAgICAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBjYW5jZWxFdmVudCwgdHJ1ZSk7XG4gICAgICAgICAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIG9uTW92ZSk7XG4gICAgICAgICAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBvbkVuZCk7XG4gICAgICAgICAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgb25FbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByYWZEcmFnTW92ZShlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFpc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGRpc3RhbmNlQmV0d2Vlbihpbml0aWFsUG9zaXRpb24sIHtcbiAgICAgICAgICAgICAgICB4OiBlLnBhZ2VYLFxuICAgICAgICAgICAgICAgIHk6IGUucGFnZVksXG4gICAgICAgICAgICAgIH0pID4gNVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGRuZE1hbmFnZXIuZHJhZ01hbmFnZXIuZHJhZ1N0YXJ0KGluaXRpYWxFdmVudCwgZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJhZkRyYWdNb3ZlKGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3Qgb25FbmQgPSAoZTogUG9pbnRlckV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChlLnBvaW50ZXJJZCAhPT0gcG9pbnRlcklkKSByZXR1cm47XG4gICAgICAgIHdpbi5jbGVhclRpbWVvdXQobG9uZ1ByZXNzVGltZW91dCk7XG4gICAgICAgIHJhZkRyYWdNb3ZlLmNhbmNlbCgpO1xuICAgICAgICBpc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgICAgICAgZG5kTWFuYWdlci5kcmFnTWFuYWdlci5kcmFnRW5kKGUpO1xuXG4gICAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIG9uTW92ZSk7XG4gICAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBvbkVuZCk7XG4gICAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgb25FbmQpO1xuXG4gICAgICAgIGlmIChpc1RvdWNoRXZlbnQpIHtcbiAgICAgICAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBjYW5jZWxFdmVudCwgdHJ1ZSk7XG4gICAgICAgICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGNhbmNlbEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgb25Nb3ZlKTtcbiAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBvbkVuZCk7XG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIG9uRW5kKTtcbiAgICB9O1xuXG4gICAgY29uc3Qgc3dhbGxvd1RvdWNoRXZlbnQgPSAoZTogVG91Y2hFdmVudCkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9O1xuXG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgb25Qb2ludGVyRG93bik7XG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBzd2FsbG93VG91Y2hFdmVudCk7XG5cbiAgICB1bmJpbmQuY3VycmVudCA9ICgpID0+IHtcbiAgICAgIGhhbmRsZS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIG9uUG9pbnRlckRvd24pO1xuICAgICAgaGFuZGxlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBzd2FsbG93VG91Y2hFdmVudCk7XG4gICAgfTtcbiAgfSwgW10pO1xufVxuIl19