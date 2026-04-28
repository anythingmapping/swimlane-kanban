// Re-export Nestable from dnd for convenience
export type { Nestable, Path } from './dnd/types';

export interface ItemData {
  title: string;
  checked: boolean;
  score?: number;
  priority?: string;
}

export interface ColumnData {
  title: string;
  wipLimit?: number;
  width?: number;
}

export interface SwimlaneData {
  title: string;
  collapsed?: boolean;
  description?: string;
  color?: string;
  scaffold?: string[];
}

export interface ErrorReport {
  description: string;
  stack: string;
}

export interface SwimlaneKanbanSettings {
  'column-width'?: number;
  'default-columns'?: string[];
  'default-wip'?: number;
  theme?: string;
}

export interface SprintConfig {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface BoardData {
  settings: SwimlaneKanbanSettings;
  archive: Item[];
  errors: ErrorReport[];
  sprint?: SprintConfig;
}

// Nestable<Data, Child>
import { Nestable } from './dnd/types';

export type Item = Nestable<ItemData>;
export type Column = Nestable<ColumnData, Item>;
export type Swimlane = Nestable<SwimlaneData, Column>;
export type Board = Nestable<BoardData, Swimlane>;

export const DataTypes = {
  Item: 'item',
  Column: 'column',
  Swimlane: 'swimlane',
  Board: 'board',
} as const;

export const ItemTemplate = {
  accepts: [DataTypes.Item],
  type: DataTypes.Item,
  children: [] as Item[],
};

export const ColumnTemplate = {
  accepts: [DataTypes.Item],
  type: DataTypes.Column,
};

export const SwimlaneTemplate = {
  accepts: [DataTypes.Column],
  type: DataTypes.Swimlane,
};

export const BoardTemplate = {
  accepts: [] as string[],
  type: DataTypes.Board,
};

export function generateInstanceId(len: number = 9): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + len);
}
