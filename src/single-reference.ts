import type { ISU } from "./index.ts";
import type { Special } from "./special.ts";
import type { Table } from "./table.ts";

declare const __singleReference: unique symbol;

export type SingleReference<T extends Table | null, IN extends string, OUT extends keyof NonNullable<T>> = Special<T & {
  [__singleReference]: {
    input: IN;
    output: OUT;
    type: T;
  };
}>;

export type SelectableSingleReference<T extends Table | null> =
  {
    // @ts-expect-error any is used to allow for any type of input
    [K in keyof NonNullable<T> as NonNullable<T>[K] extends SingleReference<unknown, string, any> ? K : never]:
    NonNullable<T>[K] extends SingleReference<infer U, string, any> ? PotentialNullable<U, ISU.Selectable<NonNullable<U>>> : never;
  } &
  {
    // @ts-expect-error any is used to allow for any type of input
    [K in keyof NonNullable<T> as NonNullable<T>[K] extends SingleReference<unknown, infer IN, any> ? IN : never]:
    // @ts-expect-error _ is here in any case as it is manually added
    NonNullable<T>[K] extends SingleReference<infer S, string, infer OUT> ? PotentialNullable<S, ISU.Selectable<{ '_': NonNullable<S>[OUT] }>['_']> : never;
  };

export type InsertableSingleReference<T extends Table | null> =
  {
    // @ts-expect-error any is used to allow for any type of input
    [K in keyof NonNullable<T> as NonNullable<T>[K] extends SingleReference<unknown, infer IN, any> ? IN : never]:
    // @ts-expect-error _ is here in any case as it is manually added
    NonNullable<T>[K] extends SingleReference<infer S, string, infer OUT> ? PotentialNullable<S, ISU.Selectable<{ '_': NonNullable<S>[OUT] }>['_']> : never;
  }

type PotentialNullable<T, REAL_TYPE> = null extends T ? REAL_TYPE | null : REAL_TYPE;
