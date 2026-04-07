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
  const val: any = replacement ? [last, 1, replacement] : [last, 1];
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

export function moveEntity(
  root: Nestable,
  source: Path,
  destination: Path,
  transform?: (entity: Nestable) => Nestable | Nestable[],
  replace?: (entity: Nestable) => Nestable
) {
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
  return update(root, mutation);
}

function deepMergeSpecs(a: any, b: any): any {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a !== 'object' || typeof b !== 'object') return b;
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];

  const result: any = { ...a };
  for (const key of Object.keys(b)) {
    result[key] = deepMergeSpecs(a[key], b[key]);
  }
  return result;
}

export function removeEntity(root: Nestable, target: Path, replacement?: Nestable) {
  return update(root, buildRemoveMutation(target, replacement));
}

export function insertEntity(root: Nestable, destination: Path, entities: Nestable[]) {
  return update(root, buildInsertMutation(destination, entities));
}

export function appendEntities(root: Nestable, destination: Path, entities: Nestable[]) {
  return update(root, buildAppendMutation(destination, entities));
}

export function prependEntities(root: Nestable, destination: Path, entities: Nestable[]) {
  return update(root, buildPrependMutation(destination, entities));
}

export function updateEntity(root: Nestable, path: Path, mutation: Spec<Nestable>) {
  return update(root, buildUpdateMutation(path, mutation));
}

export function updateParentEntity(root: Nestable, path: Path, mutation: Spec<Nestable>) {
  return update(root, buildUpdateParentMutation(path, mutation));
}
