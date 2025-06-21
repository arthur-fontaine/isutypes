import type { ISU } from ".";

export interface ITransactionTable {
	id: ISU.Generated<string>;
	reference: string;
	amount: number;
	currency: string;
	status: "created" | "processing" | "completed" | "failed" | "cancelled";
	metadata: Record<string, string> | null;
	createdAt: Date;
	updatedAt: Date | null;
	deletedAt: Date | null;

	store: ISU.SingleReference<IStoreTable, 'storeId', 'id'>;
}
export interface ITransaction extends ISU.Selectable<ITransactionTable> {}
export interface IInsertTransaction extends ISU.Insertable<ITransactionTable> {}
export interface IUpdateTransaction extends ISU.Updateable<ITransactionTable> {}

export interface IStoreTable {
  id: ISU.Generated<string>;
  name: string;

  transactions: ISU.ManyReference<ITransactionTable>;
}
export interface IStore extends ISU.Selectable<IStoreTable> {}
export interface IInsertStore extends ISU.Insertable<IStoreTable> {}
export interface IUpdateStore extends ISU.Updateable<IStoreTable> {}
