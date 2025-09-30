import { IListIndex } from "../ListIndex/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface ISwapDiff {
  swaps: IListIndex[];
  overwrites: IListIndex[];
  newListIndexes: IListIndex[];
}
