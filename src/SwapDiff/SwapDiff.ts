import { IListIndex } from "../ListIndex/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { ISwapDiff } from "./types";

class SwapDiff implements ISwapDiff {
  swaps: Set<IListIndex> = new Set();
  overwrites: Set<IListIndex> = new Set();
  oldListValue: any[] | undefined | null = null;
  newListValue: any[] | undefined | null = null;
  oldIndexes: IListIndex[] = [];
  newIndexes: IListIndex[] = [];
}

export function createSwapDiff(): ISwapDiff {
  return new SwapDiff();
}