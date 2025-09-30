import { IListIndex } from "../ListIndex/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface ISwapDiff {
  swaps: Set<IListIndex>;
  overwrites: Set<IListIndex>;
  oldListValue: any[] | undefined | null;
  newListValue: any[] | undefined | null;
  oldIndexes: IListIndex[];
  newIndexes: IListIndex[];
}
