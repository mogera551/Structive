
export interface IListIndex {
  parentListIndex: IListIndex | null;
  index          : number;
  readonly id      : number;
  readonly indexes : number[];
  readonly position: number;
  readonly length: number;
  truncate(length: number): IListIndex | null;
  add(value: number): IListIndex;
  reverseIterator(): Generator<IListIndex>;
  iterator(): Generator<IListIndex>;
  toString(): string;
  at(position: number): IListIndex | null;
}
