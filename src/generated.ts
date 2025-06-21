import type { Special } from "./special";
import type { Table } from "./table";

declare const __generated: unique symbol;

export type Generated<T> = Special<T & { [__generated]: true }>;

export type SelectableGenerated<T extends Table> = {
  [K in keyof T as T[K] extends Generated<unknown> ? K : never]: T[K] extends Generated<infer U> ? U : never;
};

export type InsertableGenerated<T extends Table> = {
  [K in keyof T as T[K] extends Generated<unknown> ? never : never]: T[K] extends Generated<infer U> ? U : never;
}
