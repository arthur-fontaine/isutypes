import type { ISU } from "./index.ts";
import type { Special } from "./special.ts";
import type { Table } from "./table.ts";

declare const __manyReference: unique symbol;

export type ManyReference<T> = Special<T & { [__manyReference]: true }>;

export type SelectableManyReference<T extends Table> =
  {
    [K in keyof T as T[K] extends ManyReference<unknown> ? K : never]:
    T[K] extends ManyReference<infer U> ? ISU.Selectable<U>[] : never;
  };

export type InsertableManyReference<T extends Table> =
  {
    [K in keyof T as T[K] extends ManyReference<unknown> ? never : never]: T[K];
  }
