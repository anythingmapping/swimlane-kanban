import { RefObject } from 'preact/compat';
import { useEffect } from 'preact/hooks';

export const baseClassName = 'swimlane-kanban';

const classCache = new Map<string, string>();
export function c(className: string) {
  if (classCache.has(className)) return classCache.get(className);
  const cls = `${baseClassName}__${className}`;
  classCache.set(className, cls);
  return cls;
}

export function generateInstanceId(len: number = 9): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + len);
}

export function useOnMount(refs: RefObject<HTMLElement>[], cb: () => void, onUnmount?: () => void) {
  useEffect(() => {
    let complete = 0;
    let unmounted = false;
    const onDone = () => {
      if (unmounted) return;
      if (++complete === refs.length) {
        cb();
      }
    };
    for (const ref of refs) ref.current?.onNodeInserted(onDone, true);
    return () => {
      unmounted = true;
      onUnmount();
    };
  }, []);
}
