import { createListIndex } from "../../ListIndex/ListIndex";
function isSameList(oldList, newList) {
    if (oldList.length !== newList.length) {
        return false;
    }
    for (let i = 0; i < oldList.length; i++) {
        if (oldList[i] !== newList[i]) {
            return false;
        }
    }
    return true;
}
export function createListIndexes(parentListIndex, oldList, newList, oldIndexes) {
    oldList = Array.isArray(oldList) ? oldList : [];
    newList = Array.isArray(newList) ? newList : [];
    const newIndexes = [];
    if (newList.length === 0) {
        return [];
    }
    if (oldList.length === 0) {
        for (let i = 0; i < newList.length; i++) {
            const newListIndex = createListIndex(parentListIndex, i);
            newIndexes.push(newListIndex);
        }
        return newIndexes;
    }
    if (isSameList(oldList, newList)) {
        return oldIndexes;
    }
    // インデックスベースのマップを使用して効率化
    const indexByValue = new Map();
    for (let i = 0; i < oldList.length; i++) {
        // 重複値の場合は最後のインデックスが優先される（既存動作を維持）
        indexByValue.set(oldList[i], i);
    }
    for (let i = 0; i < newList.length; i++) {
        const newValue = newList[i];
        const oldIndex = indexByValue.get(newValue);
        if (typeof oldIndex === "undefined") {
            // 新しい要素
            const newListIndex = createListIndex(parentListIndex, i);
            newIndexes.push(newListIndex);
        }
        else {
            // 既存要素の再利用
            const existingListIndex = oldIndexes[oldIndex];
            if (existingListIndex.index !== i) {
                existingListIndex.index = i;
            }
            newIndexes.push(existingListIndex);
        }
    }
    return newIndexes;
}
