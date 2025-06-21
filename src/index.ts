import type { InsertableGenerated, SelectableGenerated } from "./generated";
import type { InsertableManyReference, SelectableManyReference } from "./many-reference";
import type { Merge4Types } from "./merge-types";
import type { InsertableSingleReference, SelectableSingleReference } from "./single-reference";
import type { SelectableNotSpecial, InsertableNotSpecial } from "./special";
import type { Table } from "./table";
import type { Generated as Generated_ } from "./generated";
import type { SingleReference as SingleReference_ } from "./single-reference";
import type { ManyReference as ManyReference_ } from "./many-reference";

export namespace ISU {
  export type Generated<T> = Generated_<T>;
  export type SingleReference<T, IN extends string, OUT extends keyof T> = SingleReference_<T, IN, OUT>;
  export type ManyReference<T> = ManyReference_<T>;

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
