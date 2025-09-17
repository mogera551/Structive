
export interface IListIndex {
  readonly parentListIndex: IListIndex | null;
  readonly id: number;
  readonly sid: string;
  readonly position: number;
  readonly length: number;
  index: number;
  readonly version: number;
  readonly dirty: boolean;
  readonly indexes: number[];
  readonly listIndexes: WeakRef<IListIndex>[];
  readonly varName: string;
  at(position: number): IListIndex | null;
}
