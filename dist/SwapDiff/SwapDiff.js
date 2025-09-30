class SwapDiff {
    swaps = new Set();
    overwrites = new Set();
    oldListValue = null;
    newListValue = null;
    oldIndexes = [];
    newIndexes = [];
}
export function createSwapDiff() {
    return new SwapDiff();
}
