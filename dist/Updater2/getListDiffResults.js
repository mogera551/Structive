import { createListIndex2 } from "../ListIndex2/ListIndex2";
import { raiseError } from "../utils";
function listDiffNew(newValue, parentListIndex) {
    const adds = new Set();
    const newListIndexesSet = new Set();
    for (let i = 0; i < newValue.length; i++) {
        // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
        // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
        const newListIndex = createListIndex2(parentListIndex, i);
        adds.add(newListIndex);
        newListIndexesSet.add(newListIndex);
    }
    return { adds, newListIndexesSet };
}
function listDiffUpdate(oldValue, oldListIndexesSet, newValue, parentListIndex) {
    const adds = new Set();
    const updates = new Set();
    // 新しいリスト要素に基づいて、リストインデックスを再構築する
    const newListIndexesSet = new Set();
    const oldListIndexesByValue = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
    for (let i = 0; i < newValue.length; i++) {
        // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
        // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
        const lastListIndex = oldListIndexesByValue.get(newValue[i])?.shift();
        if (lastListIndex) {
            if (lastListIndex.index !== i) {
                lastListIndex.index = i;
                updates.add(lastListIndex);
            }
            newListIndexesSet.add(lastListIndex);
        }
        else {
            const newListIndex = createListIndex2(parentListIndex, i);
            adds.add(newListIndex);
            newListIndexesSet.add(newListIndex);
        }
    }
    const removes = oldListIndexesSet.difference(newListIndexesSet);
    return { adds, updates, removes, newListIndexesSet };
}
/**
 * リストの差分結果を取得する
 * @param oldValue 古い値
 * @param oldListIndexesSet 古いリストインデックスセット
 * @param newValue 新しい値
 * @param parentListIndex 親リストインデックス
 * @returns リストの差分結果
 */
export function getListDiffResults(oldValue, oldListIndexesSet, newValue, parentListIndex) {
    if (oldValue != null && newValue != null) {
        if (!oldListIndexesSet)
            raiseError("Old list indexes set is not provided for existing old value.");
        if (oldValue.length > 0 && newValue.length > 0) {
            return listDiffUpdate(oldValue, oldListIndexesSet, newValue, parentListIndex);
        }
        else if (newValue.length > 0) {
            return listDiffNew(newValue, parentListIndex);
        }
        else { // oldValue.length > 0
            const removes = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
            return { removes };
        }
    }
    else if (newValue != null) {
        return listDiffNew(newValue, parentListIndex);
    }
    else { // oldValue != null
        const removes = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
        return { removes };
    }
}
