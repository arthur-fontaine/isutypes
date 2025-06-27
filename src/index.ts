import type { InsertableGenerated, SelectableGenerated } from "./generated.ts";
import type { InsertableManyReference, SelectableManyReference } from "./many-reference.ts";
import type { Merge4Types } from "./merge-types.ts";
import type { InsertableSingleReference, SelectableSingleReference } from "./single-reference.ts";
import type { SelectableNotSpecial, InsertableNotSpecial } from "./special.ts";
import type { Table } from "./table.ts";
import type { Generated as Generated_ } from "./generated.ts";
import type { SingleReference as SingleReference_ } from "./single-reference.ts";
import type { ManyReference as ManyReference_ } from "./many-reference.ts";

export namespace ISU {
  export type Generated<T> = Generated_<T>;
  export type SingleReference<T extends Table | null, IN extends string, OUT extends keyof NonNullable<Selectable<NonNullable<T>>>> = SingleReference_<T, IN, OUT>;
  export type ManyReference<T extends Table> = ManyReference_<T>;

  export type Selectable<T extends Table> = Merge4Types<
    SelectableNotSpecial<T>,
    SelectableSingleReference<T>,
    SelectableManyReference<T>,
    SelectableGenerated<T>
  >

  export type Insertable<T extends Table> = Merge4Types<
    InsertableSingleReference<T>,
    InsertableGenerated<T>,
    InsertableManyReference<T>,
    InsertableNotSpecial<T>
  >

  export type Updateable<T extends Table> = Partial<Insertable<T>>
}
