export type Merge2Types<A, B> = Omit<A, keyof B> & B;
export type Merge3Types<A, B, C> = Merge2Types<Merge2Types<A, B>, C>;
export type Merge4Types<A, B, C, D> = Merge2Types<Merge3Types<A, B, C>, D>;
export type Merge5Types<A, B, C, D, E> = Merge2Types<Merge4Types<A, B, C, D>, E>;
