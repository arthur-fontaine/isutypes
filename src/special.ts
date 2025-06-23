import type { Table } from "./table.ts";

declare const __special: unique symbol;

export type Special<T> = T & { [__special]: true };

export type SelectableNotSpecial<T extends Table> = {
  [K in keyof T as T[K] extends Special<unknown> ? never : K]: T[K] extends Special<infer U> ? U : T[K];
};

export type InsertableNotSpecial<T extends Table> = {
  [K in keyof T as T[K] extends Special<unknown> ? never : K]: T[K] extends Special<infer U> ? U : T[K];
}
