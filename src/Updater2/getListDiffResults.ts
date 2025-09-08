import { createListIndex2 } from "../ListIndex2/ListIndex2";
import { IListIndex2 } from "../ListIndex2/types";
import { raiseError } from "../utils";
import { IListDiffResults } from "./types";

function listDiffNew(
  newValue: any[],
  parentListIndex: IListIndex2 | null,
): IListDiffResults {
  const adds: Set<IListIndex2> = new Set();
  const newListIndexesSet: Set<IListIndex2> = new Set();
  for(let i = 0; i < newValue.length; i++) {
    // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
    // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
    const newListIndex = createListIndex2(parentListIndex, i);
    adds.add(newListIndex);
    newListIndexesSet.add(newListIndex);
  }
  return { adds, newListIndexesSet };
}

function listDiffUpdate(
  oldValue: any[], 
  oldListIndexesSet: Set<IListIndex2>,
  newValue: any[],
  parentListIndex: IListIndex2 | null,
): IListDiffResults {
  const adds: Set<IListIndex2> = new Set();
  const updates: Set<IListIndex2> = new Set();
  // 新しいリスト要素に基づいて、リストインデックスを再構築する
  const newListIndexesSet:Set<IListIndex2> = new Set();
  const oldListIndexesByValue = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
  for(let i = 0; i < newValue.length; i++) {
    // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
    // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
    const lastListIndex = oldListIndexesByValue.get(newValue[i])?.shift();
    if (lastListIndex) {
      if (lastListIndex.index !== i) {
        lastListIndex.index = i;
        updates.add(lastListIndex);
      }
      newListIndexesSet.add(lastListIndex);
    } else {
      const newListIndex = createListIndex2(parentListIndex, i);
      adds.add(newListIndex);
      newListIndexesSet.add(newListIndex);
    }
  }
  const removes: Set<IListIndex2> = oldListIndexesSet.difference(newListIndexesSet);
  return { adds, updates, removes, newListIndexesSet}
}

export function getListDiffResults(
  oldValue: any[] | undefined | null,
  oldListIndexesSet: Set<IListIndex2> | undefined | null,
  newValue: any[] | undefined | null,
  parentListIndex: IListIndex2 | null,
): IListDiffResults {
  if (oldValue != null && newValue != null) {
    if (!oldListIndexesSet) raiseError("Old list indexes set is not provided for existing old value.");
    if (oldValue.length > 0 && newValue.length > 0) {
      return listDiffUpdate(oldValue, oldListIndexesSet, newValue, parentListIndex);
    } else if (newValue.length > 0) {
      return listDiffNew(newValue, parentListIndex);
    } else { // oldValue.length > 0
      const removes: Set<IListIndex2> = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
      return { removes };
    }
  } else if (newValue != null) {
    return listDiffNew(newValue, parentListIndex);
  } else { // oldValue != null
    const removes: Set<IListIndex2> = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
    return { removes };
  }
}
