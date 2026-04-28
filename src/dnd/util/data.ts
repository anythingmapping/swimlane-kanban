import update, { Spec } from 'immutability-helper';

import { Nestable, Path } from '../types';
import { SiblingDirection, getSiblingDirection } from './path';

export function getEntityFromPath(root: Nestable, path: Path): Nestable {
  const step = path.length ? path[0] : null;
  if (step !== null && root.children && root.children[step]) {
    return getEntityFromPath(root.children[step], path.slice(1));
  }
  return root;
}

export function buildUpdateMutation(path: Path, mutation: Spec<Nestable>) {
  let pathedMutation: Spec<Nestable> = mutation;
  for (let i = path.length - 1; i >= 0; i--) {
    pathedMutation = { children: { [path[i]]: pathedMutation } };
  }
  return pathedMutation;
}

export function buildUpdateParentMutation(path: Path, mutation: Spec<Nestable>) {
  let pathedMutation: Spec<Nestable> = mutation;
  for (let i = path.length - 2; i >= 0; i--) {
    pathedMutation = { children: { [path[i]]: pathedMutation } };
  }
  return pathedMutation;
}

export function buildRemoveMutation(path: Path, replacement?: Nestable) {
  const last = path[path.length - 1];
  const val: [number, number, ...Nestable[]] = replacement ? [last, 1, replacement] : [last, 1];
  return buildUpdateParentMutation(path, { children: { $splice: [val] } });
}

export function buildInsertMutation(
  destination: Path,
  entities: Nestable[],
  destinationModifier: number = 0
) {
  const last = destination[destination.length - 1];
  return buildUpdateParentMutation(destination, {
    children: { $splice: [[last + destinationModifier, 0, ...entities]] },
  });
}

export function buildAppendMutation(destination: Path, entities: Nestable[]) {
  return buildUpdateParentMutation(destination, { children: { $push: entities } });
}

export function buildPrependMutation(destination: Path, entities: Nestable[]) {
  return buildUpdateParentMutation(destination, { children: { $unshift: entities } });
}

export function moveEntity<T extends Nestable>(
  root: T,
  source: Path,
  destination: Path,
  transform?: (entity: Nestable) => Nestable | Nestable[],
  replace?: (entity: Nestable) => Nestable
): T {
  const entity = transform
    ? transform(getEntityFromPath(root, source))
    : getEntityFromPath(root, source);
  const siblingDirection = getSiblingDirection(source, destination);
  const destinationModifier = siblingDirection === SiblingDirection.After ? -1 : 0;

  const replacement = replace?.(getEntityFromPath(root, source));
  const removeMutation = buildRemoveMutation(source, replacement);
  const insertMutation = buildInsertMutation(
    destination,
    Array.isArray(entity) ? entity : [entity],
    destinationModifier
  );

  // Simple deep merge for specs
  const mutation = deepMergeSpecs(removeMutation, insertMutation);
  return update(root, mutation) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive merge of immutability-helper Spec objects
function deepMergeSpecs(a: any, b: any): any {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a !== 'object' || typeof b !== 'object') return b;
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];

  const result: Record<string, unknown> = { ...a };
  for (const key of Object.keys(b)) {
    result[key] = deepMergeSpecs(a[key], b[key]);
  }
  return result;
}

export function removeEntity<T extends Nestable>(root: T, target: Path, replacement?: Nestable): T {
  return update(root, buildRemoveMutation(target, replacement)) as T;
}

export function insertEntity<T extends Nestable>(root: T, destination: Path, entities: Nestable[]): T {
  return update(root, buildInsertMutation(destination, entities)) as T;
}

export function appendEntities<T extends Nestable>(root: T, destination: Path, entities: Nestable[]): T {
  return update(root, buildAppendMutation(destination, entities)) as T;
}

export function prependEntities<T extends Nestable>(root: T, destination: Path, entities: Nestable[]): T {
  return update(root, buildPrependMutation(destination, entities)) as T;
}

export function updateEntity<T extends Nestable>(root: T, path: Path, mutation: Spec<Nestable>): T {
  return update(root, buildUpdateMutation(path, mutation)) as T;
}

export function updateParentEntity<T extends Nestable>(root: T, path: Path, mutation: Spec<Nestable>): T {
  return update(root, buildUpdateParentMutation(path, mutation)) as T;
}
