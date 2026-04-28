import EventEmitter from 'eventemitter3';
import { generateInstanceId } from '../helpers';
import { initialScrollShift, initialScrollState } from '../types';
import { getParentWindow } from '../util/getWindow';
import { adjustHitbox, calculateHitbox, emptyDomRect } from '../util/hitbox';
export class EntityManager {
    constructor(dndManager, scopeId, id, index, parent, scrollParent, sortManager, data) {
        this.isVisible = false;
        this.mounted = false;
        this.id = id;
        this.instanceId = generateInstanceId();
        this.scopeId = scopeId;
        this.entityId = `${scopeId}-${id}`;
        this.emitter = new EventEmitter();
        this.dndManager = dndManager;
        this.index = index;
        this.children = new Map();
        this.parent = parent;
        this.scrollParent = scrollParent;
        this.getEntityData = () => data.current;
        this.sortManager = sortManager;
    }
    initNodes(entityNode, measureNode) {
        var _a, _b, _c;
        this.mounted = true;
        this.entityNode = entityNode;
        this.measureNode = measureNode;
        measureNode.dataset.hitboxid = this.entityId;
        (_a = this.sortManager) === null || _a === void 0 ? void 0 : _a.registerSortable(this.entityId, this.getEntity(emptyDomRect), entityNode, measureNode);
        if (this.scrollParent) {
            this.scrollParent.registerObserverHandler(this.entityId, measureNode, (entry) => {
                var _a, _b;
                const win = getParentWindow(entry.target);
                if (entry.isIntersecting) {
                    const entity = this.getEntity(entry.boundingClientRect);
                    (_a = this.parent) === null || _a === void 0 ? void 0 : _a.children.set(this.entityId, {
                        entity,
                        manager: this,
                    });
                    this.dndManager.observeResize(measureNode);
                    if (!this.parent || this.parent.isVisible) {
                        this.dndManager.registerHitboxEntity(this.entityId, entity, win);
                        this.children.forEach((child, childId) => {
                            this.dndManager.registerHitboxEntity(childId, child.entity, win);
                        });
                        this.setVisibility(true);
                    }
                }
                else {
                    this.dndManager.unregisterHitboxEntity(this.entityId, win);
                    this.children.forEach((_, childId) => {
                        this.dndManager.unregisterHitboxEntity(childId, win);
                    });
                    (_b = this.parent) === null || _b === void 0 ? void 0 : _b.children.delete(this.entityId);
                    this.dndManager.unobserveResize(measureNode);
                    this.setVisibility(false);
                }
            });
            // Register immediately with current rect so the entity is available without
            // waiting for the first async IntersectionObserver callback. The observer
            // callback will overwrite this with the precise entry.boundingClientRect
            // once it fires, and will handle deregistration when scrolled off-screen.
            const rect = measureNode.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                const entity = this.getEntity(rect);
                (_b = this.parent) === null || _b === void 0 ? void 0 : _b.children.set(this.entityId, { entity, manager: this });
                this.dndManager.observeResize(measureNode);
                if (!this.parent || this.parent.isVisible) {
                    this.dndManager.registerHitboxEntity(this.entityId, entity, getParentWindow(entityNode));
                    this.setVisibility(true);
                }
            }
        }
        else {
            const entity = this.getEntity(measureNode.getBoundingClientRect());
            this.dndManager.observeResize(measureNode);
            this.dndManager.registerHitboxEntity(this.entityId, entity, getParentWindow(entityNode));
            (_c = this.parent) === null || _c === void 0 ? void 0 : _c.children.set(this.entityId, {
                entity,
                manager: this,
            });
            this.setVisibility(true);
        }
    }
    setVisibility(isVisible) {
        this.emitter.emit('visibility-change', isVisible);
        this.isVisible = isVisible;
        this.children.forEach((child) => {
            child.manager.setVisibility(isVisible);
        });
    }
    destroy() {
        var _a, _b, _c;
        if (!this.mounted)
            return;
        this.mounted = false;
        this.dndManager.unobserveResize(this.measureNode);
        (_a = this.sortManager) === null || _a === void 0 ? void 0 : _a.unregisterSortable(this.entityId);
        (_b = this.scrollParent) === null || _b === void 0 ? void 0 : _b.unregisterObserverHandler(this.entityId, this.measureNode);
        if (this.entityNode) {
            this.dndManager.unregisterHitboxEntity(this.entityId, getParentWindow(this.entityNode));
        }
        (_c = this.parent) === null || _c === void 0 ? void 0 : _c.children.delete(this.entityId);
    }
    getPath() {
        var _a;
        return [...(((_a = this.parent) === null || _a === void 0 ? void 0 : _a.getPath()) || []), this.index];
    }
    getEntity(rect) {
        var _a, _b;
        const manager = this;
        return {
            scopeId: this.scopeId,
            entityId: this.entityId,
            initial: calculateHitbox(rect, ((_a = manager.scrollParent) === null || _a === void 0 ? void 0 : _a.scrollState) || initialScrollState, ((_b = manager.scrollParent) === null || _b === void 0 ? void 0 : _b.getScrollShift()) || initialScrollShift, null),
            getParentScrollState() {
                var _a;
                return ((_a = manager.scrollParent) === null || _a === void 0 ? void 0 : _a.scrollState) || initialScrollState;
            },
            getParentScrollShift() {
                var _a;
                return ((_a = manager.scrollParent) === null || _a === void 0 ? void 0 : _a.getScrollShift()) || initialScrollShift;
            },
            recalcInitial() {
                var _a, _b;
                this.initial = calculateHitbox(manager.measureNode.getBoundingClientRect(), ((_a = manager.scrollParent) === null || _a === void 0 ? void 0 : _a.scrollState) || initialScrollState, ((_b = manager.scrollParent) === null || _b === void 0 ? void 0 : _b.getScrollShift()) || initialScrollShift, null);
            },
            getHitbox() {
                return adjustHitbox(this.initial[0], this.initial[1], this.initial[2], this.initial[3], this.getParentScrollState(), this.getParentScrollShift());
            },
            getPath() {
                return manager.getPath();
            },
            getData() {
                var _a;
                return {
                    ...manager.getEntityData(),
                    sortAxis: (_a = manager.sortManager) === null || _a === void 0 ? void 0 : _a.axis,
                    win: getParentWindow(manager.measureNode),
                };
            },
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW50aXR5TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkVudGl0eU1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVoRCxPQUFPLEVBQTRCLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzVGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQVU3RSxNQUFNLE9BQU8sYUFBYTtJQW1CeEIsWUFDRSxVQUFzQixFQUN0QixPQUFlLEVBQ2YsRUFBVSxFQUNWLEtBQWEsRUFDYixNQUE0QixFQUM1QixZQUFrQyxFQUNsQyxXQUErQixFQUMvQixJQUEyQjtRQWpCN0IsY0FBUyxHQUFZLEtBQUssQ0FBQztRQUMzQixZQUFPLEdBQVksS0FBSyxDQUFDO1FBa0J2QixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxVQUFVLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQztRQUN2QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsT0FBTyxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUVsQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFD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QyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQ2YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFDZixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUNmLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxFQUMzQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FDNUIsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPO2dCQUNMLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPOztnQkFDTCxPQUFPO29CQUNMLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRTtvQkFDMUIsUUFBUSxFQUFFLE1BQUEsT0FBTyxDQUFDLFdBQVcsMENBQUUsSUFBSTtvQkFDbkMsR0FBRyxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO2lCQUMxQyxDQUFDO1lBQ0osQ0FBQztTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0IHsgUmVmT2JqZWN0IH0gZnJvbSAncHJlYWN0L2NvbXBhdCc7XG5pbXBvcnQgeyBnZW5lcmF0ZUluc3RhbmNlSWQgfSBmcm9tICcuLi9oZWxwZXJzJztcblxuaW1wb3J0IHsgRW50aXR5LCBFbnRpdHlEYXRhLCBQYXRoLCBpbml0aWFsU2Nyb2xsU2hpZnQsIGluaXRpYWxTY3JvbGxTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGdldFBhcmVudFdpbmRvdyB9IGZyb20gJy4uL3V0aWwvZ2V0V2luZG93JztcbmltcG9ydCB7IGFkanVzdEhpdGJveCwgY2FsY3VsYXRlSGl0Ym94LCBlbXB0eURvbVJlY3QgfSBmcm9tICcuLi91dGlsL2hpdGJveCc7XG5pbXBvcnQgeyBEbmRNYW5hZ2VyIH0gZnJvbSAnLi9EbmRNYW5hZ2VyJztcbmltcG9ydCB7IFNjcm9sbE1hbmFnZXIgfSBmcm9tICcuL1Njcm9sbE1hbmFnZXInO1xuaW1wb3J0IHsgU29ydE1hbmFnZXIgfSBmcm9tICcuL1NvcnRNYW5hZ2VyJztcblxuaW50ZXJmYWNlIENoaWxkIHtcbiAgbWFuYWdlcjogRW50aXR5TWFuYWdlcjtcbiAgZW50aXR5OiBFbnRpdHk7XG59XG5cbmV4cG9ydCBjbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgY2hpbGRyZW46IE1hcDxzdHJpbmcsIENoaWxkPjtcbiAgZG5kTWFuYWdlcjogRG5kTWFuYWdlcjtcbiAgZW50aXR5Tm9kZTogSFRNTEVsZW1lbnQ7XG4gIG1lYXN1cmVOb2RlOiBIVE1MRWxlbWVudDtcbiAgZ2V0RW50aXR5RGF0YTogKCkgPT4gRW50aXR5RGF0YTtcbiAgaW5kZXg6IG51bWJlcjtcbiAgcGFyZW50OiBFbnRpdHlNYW5hZ2VyIHwgbnVsbDtcbiAgc2Nyb2xsUGFyZW50OiBTY3JvbGxNYW5hZ2VyIHwgbnVsbDtcbiAgc29ydE1hbmFnZXI6IFNvcnRNYW5hZ2VyIHwgbnVsbDtcbiAgaXNWaXNpYmxlOiBib29sZWFuID0gZmFsc2U7XG4gIG1vdW50ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBpZDogc3RyaW5nO1xuICBpbnN0YW5jZUlkOiBzdHJpbmc7XG4gIGVudGl0eUlkOiBzdHJpbmc7XG4gIHNjb3BlSWQ6IHN0cmluZztcbiAgZW1pdHRlcjogRXZlbnRFbWl0dGVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGRuZE1hbmFnZXI6IERuZE1hbmFnZXIsXG4gICAgc2NvcGVJZDogc3RyaW5nLFxuICAgIGlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICBwYXJlbnQ6IEVudGl0eU1hbmFnZXIgfCBudWxsLFxuICAgIHNjcm9sbFBhcmVudDogU2Nyb2xsTWFuYWdlciB8IG51bGwsXG4gICAgc29ydE1hbmFnZXI6IFNvcnRNYW5hZ2VyIHwgbnVsbCxcbiAgICBkYXRhOiBSZWZPYmplY3Q8RW50aXR5RGF0YT5cbiAgKSB7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMuaW5zdGFuY2VJZCA9IGdlbmVyYXRlSW5zdGFuY2VJZCgpO1xuICAgIHRoaXMuc2NvcGVJZCA9IHNjb3BlSWQ7XG4gICAgdGhpcy5lbnRpdHlJZCA9IGAke3Njb3BlSWR9LSR7aWR9YDtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgICB0aGlzLmRuZE1hbmFnZXIgPSBkbmRNYW5hZ2VyO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLmNoaWxkcmVuID0gbmV3IE1hcCgpO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuc2Nyb2xsUGFyZW50ID0gc2Nyb2xsUGFyZW50O1xuICAgIHRoaXMuZ2V0RW50aXR5RGF0YSA9ICgpID0+IGRhdGEuY3VycmVudDtcbiAgICB0aGlzLnNvcnRNYW5hZ2VyID0gc29ydE1hbmFnZXI7XG4gIH1cblxuICBpbml0Tm9kZXMoZW50aXR5Tm9kZTogSFRNTEVsZW1lbnQsIG1lYXN1cmVOb2RlOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMubW91bnRlZCA9IHRydWU7XG4gICAgdGhpcy5lbnRpdHlOb2RlID0gZW50aXR5Tm9kZTtcbiAgICB0aGlzLm1lYXN1cmVOb2RlID0gbWVhc3VyZU5vZGU7XG5cbiAgICBtZWFzdXJlTm9kZS5kYXRhc2V0LmhpdGJveGlkID0gdGhpcy5lbnRpdHlJZDtcbiAgICB0aGlzLnNvcnRNYW5hZ2VyPy5yZWdpc3RlclNvcnRhYmxlKFxuICAgICAgdGhpcy5lbnRpdHlJZCxcbiAgICAgIHRoaXMuZ2V0RW50aXR5KGVtcHR5RG9tUmVjdCksXG4gICAgICBlbnRpdHlOb2RlLFxuICAgICAgbWVhc3VyZU5vZGVcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuc2Nyb2xsUGFyZW50KSB7XG4gICAgICB0aGlzLnNjcm9sbFBhcmVudC5yZWdpc3Rlck9ic2VydmVySGFuZGxlcih0aGlzLmVudGl0eUlkLCBtZWFzdXJlTm9kZSwgKGVudHJ5KSA9PiB7XG4gICAgICAgIGNvbnN0IHdpbiA9IGdldFBhcmVudFdpbmRvdyhlbnRyeS50YXJnZXQpO1xuXG4gICAgICAgIGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuZ2V0RW50aXR5KGVudHJ5LmJvdW5kaW5nQ2xpZW50UmVjdCk7XG4gICAgICAgICAgdGhpcy5wYXJlbnQ/LmNoaWxkcmVuLnNldCh0aGlzLmVudGl0eUlkLCB7XG4gICAgICAgICAgICBlbnRpdHksXG4gICAgICAgICAgICBtYW5hZ2VyOiB0aGlzLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdGhpcy5kbmRNYW5hZ2VyLm9ic2VydmVSZXNpemUobWVhc3VyZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKCF0aGlzLnBhcmVudCB8fCB0aGlzLnBhcmVudC5pc1Zpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuZG5kTWFuYWdlci5yZWdpc3RlckhpdGJveEVudGl0eSh0aGlzLmVudGl0eUlkLCBlbnRpdHksIHdpbik7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBjaGlsZElkKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuZG5kTWFuYWdlci5yZWdpc3RlckhpdGJveEVudGl0eShjaGlsZElkLCBjaGlsZC5lbnRpdHksIHdpbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2V0VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kbmRNYW5hZ2VyLnVucmVnaXN0ZXJIaXRib3hFbnRpdHkodGhpcy5lbnRpdHlJZCwgd2luKTtcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goKF8sIGNoaWxkSWQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZG5kTWFuYWdlci51bnJlZ2lzdGVySGl0Ym94RW50aXR5KGNoaWxkSWQsIHdpbik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5wYXJlbnQ/LmNoaWxkcmVuLmRlbGV0ZSh0aGlzLmVudGl0eUlkKTtcbiAgICAgICAgICB0aGlzLmRuZE1hbmFnZXIudW5vYnNlcnZlUmVzaXplKG1lYXN1cmVOb2RlKTtcbiAgICAgICAgICB0aGlzLnNldFZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVnaXN0ZXIgaW1tZWRpYXRlbHkgd2l0aCBjdXJyZW50IHJlY3Qgc28gdGhlIGVudGl0eSBpcyBhdmFpbGFibGUgd2l0aG91dFxuICAgICAgLy8gd2FpdGluZyBmb3IgdGhlIGZpcnN0IGFzeW5jIEludGVyc2VjdGlvbk9ic2VydmVyIGNhbGxiYWNrLiBUaGUgb2JzZXJ2ZXJcbiAgICAgIC8vIGNhbGxiYWNrIHdpbGwgb3ZlcndyaXRlIHRoaXMgd2l0aCB0aGUgcHJlY2lzZSBlbnRyeS5ib3VuZGluZ0NsaWVudFJlY3RcbiAgICAgIC8vIG9uY2UgaXQgZmlyZXMsIGFuZCB3aWxsIGhhbmRsZSBkZXJlZ2lzdHJhdGlvbiB3aGVuIHNjcm9sbGVkIG9mZi1zY3JlZW4uXG4gICAgICBjb25zdCByZWN0ID0gbWVhc3VyZU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBpZiAocmVjdC53aWR0aCA+IDAgfHwgcmVjdC5oZWlnaHQgPiAwKSB7XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuZ2V0RW50aXR5KHJlY3QpO1xuICAgICAgICB0aGlzLnBhcmVudD8uY2hpbGRyZW4uc2V0KHRoaXMuZW50aXR5SWQsIHsgZW50aXR5LCBtYW5hZ2VyOiB0aGlzIH0pO1xuICAgICAgICB0aGlzLmRuZE1hbmFnZXIub2JzZXJ2ZVJlc2l6ZShtZWFzdXJlTm9kZSk7XG4gICAgICAgIGlmICghdGhpcy5wYXJlbnQgfHwgdGhpcy5wYXJlbnQuaXNWaXNpYmxlKSB7XG4gICAgICAgICAgdGhpcy5kbmRNYW5hZ2VyLnJlZ2lzdGVySGl0Ym94RW50aXR5KHRoaXMuZW50aXR5SWQsIGVudGl0eSwgZ2V0UGFyZW50V2luZG93KGVudGl0eU5vZGUpKTtcbiAgICAgICAgICB0aGlzLnNldFZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5nZXRFbnRpdHkobWVhc3VyZU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xuICAgICAgdGhpcy5kbmRNYW5hZ2VyLm9ic2VydmVSZXNpemUobWVhc3VyZU5vZGUpO1xuICAgICAgdGhpcy5kbmRNYW5hZ2VyLnJlZ2lzdGVySGl0Ym94RW50aXR5KHRoaXMuZW50aXR5SWQsIGVudGl0eSwgZ2V0UGFyZW50V2luZG93KGVudGl0eU5vZGUpKTtcbiAgICAgIHRoaXMucGFyZW50Py5jaGlsZHJlbi5zZXQodGhpcy5lbnRpdHlJZCwge1xuICAgICAgICBlbnRpdHksXG4gICAgICAgIG1hbmFnZXI6IHRoaXMsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuc2V0VmlzaWJpbGl0eSh0cnVlKTtcbiAgICB9XG4gIH1cblxuICBzZXRWaXNpYmlsaXR5KGlzVmlzaWJsZTogYm9vbGVhbikge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCd2aXNpYmlsaXR5LWNoYW5nZScsIGlzVmlzaWJsZSk7XG4gICAgdGhpcy5pc1Zpc2libGUgPSBpc1Zpc2libGU7XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgY2hpbGQubWFuYWdlci5zZXRWaXNpYmlsaXR5KGlzVmlzaWJsZSk7XG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGlmICghdGhpcy5tb3VudGVkKSByZXR1cm47XG4gICAgdGhpcy5tb3VudGVkID0gZmFsc2U7XG4gICAgdGhpcy5kbmRNYW5hZ2VyLnVub2JzZXJ2ZVJlc2l6ZSh0aGlzLm1lYXN1cmVOb2RlKTtcbiAgICB0aGlzLnNvcnRNYW5hZ2VyPy51bnJlZ2lzdGVyU29ydGFibGUodGhpcy5lbnRpdHlJZCk7XG4gICAgdGhpcy5zY3JvbGxQYXJlbnQ/LnVucmVnaXN0ZXJPYnNlcnZlckhhbmRsZXIodGhpcy5lbnRpdHlJZCwgdGhpcy5tZWFzdXJlTm9kZSk7XG4gICAgaWYgKHRoaXMuZW50aXR5Tm9kZSkge1xuICAgICAgdGhpcy5kbmRNYW5hZ2VyLnVucmVnaXN0ZXJIaXRib3hFbnRpdHkodGhpcy5lbnRpdHlJZCwgZ2V0UGFyZW50V2luZG93KHRoaXMuZW50aXR5Tm9kZSkpO1xuICAgIH1cbiAgICB0aGlzLnBhcmVudD8uY2hpbGRyZW4uZGVsZXRlKHRoaXMuZW50aXR5SWQpO1xuICB9XG5cbiAgZ2V0UGF0aCgpOiBQYXRoIHtcbiAgICByZXR1cm4gWy4uLih0aGlzLnBhcmVudD8uZ2V0UGF0aCgpIHx8IFtdKSwgdGhpcy5pbmRleF07XG4gIH1cblxuICBnZXRFbnRpdHkocmVjdDogRE9NUmVjdFJlYWRPbmx5KTogRW50aXR5IHtcbiAgICBjb25zdCBtYW5hZ2VyID0gdGhpcztcbiAgICByZXR1cm4ge1xuICAgICAgc2NvcGVJZDogdGhpcy5zY29wZUlkLFxuICAgICAgZW50aXR5SWQ6IHRoaXMuZW50aXR5SWQsXG4gICAgICBpbml0aWFsOiBjYWxjdWxhdGVIaXRib3goXG4gICAgICAgIHJlY3QsXG4gICAgICAgIG1hbmFnZXIuc2Nyb2xsUGFyZW50Py5zY3JvbGxTdGF0ZSB8fCBpbml0aWFsU2Nyb2xsU3RhdGUsXG4gICAgICAgIG1hbmFnZXIuc2Nyb2xsUGFyZW50Py5nZXRTY3JvbGxTaGlmdCgpIHx8IGluaXRpYWxTY3JvbGxTaGlmdCxcbiAgICAgICAgbnVsbFxuICAgICAgKSxcbiAgICAgIGdldFBhcmVudFNjcm9sbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4gbWFuYWdlci5zY3JvbGxQYXJlbnQ/LnNjcm9sbFN0YXRlIHx8IGluaXRpYWxTY3JvbGxTdGF0ZTtcbiAgICAgIH0sXG4gICAgICBnZXRQYXJlbnRTY3JvbGxTaGlmdCgpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuc2Nyb2xsUGFyZW50Py5nZXRTY3JvbGxTaGlmdCgpIHx8IGluaXRpYWxTY3JvbGxTaGlmdDtcbiAgICAgIH0sXG4gICAgICByZWNhbGNJbml0aWFsKCkge1xuICAgICAgICB0aGlzLmluaXRpYWwgPSBjYWxjdWxhdGVIaXRib3goXG4gICAgICAgICAgbWFuYWdlci5tZWFzdXJlTm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgICBtYW5hZ2VyLnNjcm9sbFBhcmVudD8uc2Nyb2xsU3RhdGUgfHwgaW5pdGlhbFNjcm9sbFN0YXRlLFxuICAgICAgICAgIG1hbmFnZXIuc2Nyb2xsUGFyZW50Py5nZXRTY3JvbGxTaGlmdCgpIHx8IGluaXRpYWxTY3JvbGxTaGlmdCxcbiAgICAgICAgICBudWxsXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgZ2V0SGl0Ym94KCkge1xuICAgICAgICByZXR1cm4gYWRqdXN0SGl0Ym94KFxuICAgICAgICAgIHRoaXMuaW5pdGlhbFswXSxcbiAgICAgICAgICB0aGlzLmluaXRpYWxbMV0sXG4gICAgICAgICAgdGhpcy5pbml0aWFsWzJdLFxuICAgICAgICAgIHRoaXMuaW5pdGlhbFszXSxcbiAgICAgICAgICB0aGlzLmdldFBhcmVudFNjcm9sbFN0YXRlKCksXG4gICAgICAgICAgdGhpcy5nZXRQYXJlbnRTY3JvbGxTaGlmdCgpXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgZ2V0UGF0aCgpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuZ2V0UGF0aCgpO1xuICAgICAgfSxcbiAgICAgIGdldERhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ubWFuYWdlci5nZXRFbnRpdHlEYXRhKCksXG4gICAgICAgICAgc29ydEF4aXM6IG1hbmFnZXIuc29ydE1hbmFnZXI/LmF4aXMsXG4gICAgICAgICAgd2luOiBnZXRQYXJlbnRXaW5kb3cobWFuYWdlci5tZWFzdXJlTm9kZSksXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==