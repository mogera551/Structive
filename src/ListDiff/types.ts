import { IListIndex } from "../ListIndex/types";

export interface IListDiff {
  oldListValue: any[] | undefined | null;
  newListValue: any[] | undefined | null;
  oldIndexes: IListIndex[];
  newIndexes: IListIndex[];
  adds?: Set<IListIndex>;
  removes?: Set<IListIndex>;
  overwrites?: Set<IListIndex>; // 上書きされた要素
  changeIndexes?: Set<IListIndex>; // 位置が変わった要素
}
