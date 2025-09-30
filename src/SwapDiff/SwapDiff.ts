import { IListIndex } from "../ListIndex/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { ISwapDiff } from "./types";

class SwapDiff implements ISwapDiff {
  swaps: IListIndex[] = [];
  overwrites: IListIndex[] = [];
  newListIndexes: IListIndex[] = [];
}

export function createSwapDiff(): ISwapDiff {
  return new SwapDiff();
}