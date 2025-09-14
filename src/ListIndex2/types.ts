
export interface IListIndex2 {
  readonly parentListIndex: IListIndex2 | null;
  readonly id: number;
  readonly sid: string;
  readonly position: number;
  readonly length: number;
  index: number;
  readonly version: number;
  readonly dirty: boolean;
  readonly indexes: number[];
  readonly listIndexes: WeakRef<IListIndex2>[];
  readonly varName: string;
  at(position: number): IListIndex2 | null;
}
