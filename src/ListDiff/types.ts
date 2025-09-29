import { IListIndex } from "../ListIndex/types";

export interface IListDiff {
  oldListValue: any[] | undefined | null;
  newListValue: any[] | undefined | null;
  oldIndexes: IListIndex[];
  newIndexes: IListIndex[];
  adds?: Set<IListIndex>;
  removes?: Set<IListIndex>;
  changeIndexes?: Set<IListIndex>; // 位置が変わった要素
}
