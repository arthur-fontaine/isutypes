import type { ISU } from "./index.ts";
import type { Special } from "./special.ts";
import type { Table } from "./table.ts";

declare const __singleReference: unique symbol;

export type SingleReference<T, IN extends string, OUT extends keyof T> = Special<T & {
  [__singleReference]: {
    input: IN;
    output: OUT;
  };
}>;

export type SelectableSingleReference<T extends Table> =
  {
    [K in keyof T as T[K] extends SingleReference<unknown, string, any> ? K : never]:
    T[K] extends SingleReference<infer U, string, any> ? ISU.Selectable<U> : never;
  } &
  {
    [K in keyof T as T[K] extends SingleReference<unknown, infer IN, any> ? IN : never]:
    T[K] extends SingleReference<infer S, string, infer OUT> ? ISU.Selectable<{ '_': S[OUT] }>['_'] : never;
  };

export type InsertableSingleReference<T extends Table> =
  {
    [K in keyof T as T[K] extends SingleReference<unknown, infer IN, any> ? IN : never]:
    T[K] extends SingleReference<infer S, string, infer OUT> ? ISU.Selectable<{ '_': S[OUT] }>['_'] : never;
  }
