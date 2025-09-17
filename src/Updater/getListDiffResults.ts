import { createListIndex2 } from "../ListIndex/ListIndex";
import { IListIndex } from "../ListIndex/types";
import { raiseError } from "../utils";
import { IListDiffResults } from "./types";

function listDiffNew(
  newValue: any[],
  parentListIndex: IListIndex | null,
): IListDiffResults {
  const adds: Set<IListIndex> = new Set();
  for(let i = 0; i < newValue.length; i++) {
    // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
    // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
    const newListIndex = createListIndex2(parentListIndex, i);
    adds.add(newListIndex);
  }
  return { 
    newValue, 
    oldValue:[], 
    adds, 
    newListIndexesSet: new Set(adds), 
    oldListIndexesSet: new Set(), 
    onlySwap: true
  };
}

function listDiffUpdate(
  oldValue: any[], 
  oldListIndexesSet: Set<IListIndex>,
  newValue: any[],
  parentListIndex: IListIndex | null,
): IListDiffResults {
  const adds: Set<IListIndex> = new Set();
  const updates: Set<IListIndex> = new Set();
  // 新しいリスト要素に基づいて、リストインデックスを再構築する
  const newListIndexesSet:Set<IListIndex> = new Set();
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
  const removes: Set<IListIndex> = oldListIndexesSet.difference(newListIndexesSet);
  return { 
    newValue, 
    oldValue, 
    adds, 
    updates, 
    removes, 
    newListIndexesSet, 
    oldListIndexesSet,
    onlySwap: true 
  }
}

/**
 * リストの差分結果を取得する
 * @param oldValue 古い値
 * @param oldListIndexesSet 古いリストインデックスセット
 * @param newValue 新しい値
 * @param parentListIndex 親リストインデックス
 * @returns リストの差分結果
 */
export function getListDiffResults(
  oldValue: any[] | undefined | null,
  oldListIndexesSet: Set<IListIndex> | undefined | null,
  newValue: any[] | undefined | null,
  parentListIndex: IListIndex | null,
): IListDiffResults {
  if (oldValue != null && newValue != null) {
    if (!oldListIndexesSet) raiseError("Old list indexes set is not provided for existing old value.");
    let listDiffResults: IListDiffResults | null = null;
    if (oldValue.length > 0 && newValue.length > 0) {
      listDiffResults = listDiffUpdate(oldValue, oldListIndexesSet, newValue, parentListIndex);
    } else if (newValue.length > 0) {
      listDiffResults = listDiffNew(newValue, parentListIndex);
    } else if (oldValue.length > 0) { // oldValue.length > 0
      const removes: Set<IListIndex> = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
      listDiffResults = { 
        oldValue, 
        newValue:[], 
        removes,
        oldListIndexesSet: new Set<IListIndex>(removes),
        newListIndexesSet: new Set<IListIndex>(),
        onlySwap: true 
      };
    } else {
      listDiffResults = { 
        oldValue:[], 
        newValue:[],
        oldListIndexesSet: new Set<IListIndex>(),
        newListIndexesSet: new Set<IListIndex>(),
        onlySwap: true 
      };
    }
    return listDiffResults;
  } else if (newValue != null) {
    return listDiffNew(newValue, parentListIndex);
  } else if (oldValue != null) { // oldValue != null
    const removes: Set<IListIndex> = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
    return { 
      oldValue, 
      newValue:[], 
      removes,
      oldListIndexesSet: new Set<IListIndex>(removes),
      newListIndexesSet: new Set<IListIndex>(),
      onlySwap: true 
    };
  } else {
    return { 
      oldValue:[], 
      newValue:[],
      oldListIndexesSet: new Set<IListIndex>(),
      newListIndexesSet: new Set<IListIndex>(),
      onlySwap: true 
    };
  }
}
