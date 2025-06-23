import type { Special } from "./special.ts";
import type { Table } from "./table.ts";

declare const __generated: unique symbol;

export type Generated<T> = Special<T & {
  [__generated]: {
    type: T;
  };
}>;

export type SelectableGenerated<T extends Table> = {
  [K in keyof T as T[K] extends Generated<unknown> ? K : never]: T[K] extends Generated<infer U> ? U : never;
};

export type InsertableGenerated<T extends Table> = {
  [K in keyof T as T[K] extends Generated<unknown> ? never : never]: T[K] extends Generated<infer U> ? U : never;
}
