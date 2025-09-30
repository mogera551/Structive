import { createListIndex } from "../ListIndex/ListIndex";
export function calcListDiff(parentListIndex, oldListValue, newListValue, oldIndexes) {
    const _newListValue = newListValue || [];
    const _oldListValue = oldListValue || [];
    const _oldIndexes = oldIndexes || [];
    // 参照の同一性、または両方とも空の場合の早期リターン
    if (_newListValue === _oldListValue || (_newListValue.length === 0 && _oldListValue.length === 0)) {
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes: _oldIndexes,
        };
    }
    if (_newListValue.length === 0) {
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes: [],
            removes: new Set(_oldIndexes),
        };
    }
    else if (_oldListValue.length === 0) {
        const newIndexes = [];
        for (let i = 0; i < _newListValue.length; i++) {
            newIndexes.push(createListIndex(parentListIndex, i));
        }
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes,
            adds: new Set(newIndexes),
        };
    }
    else {
        // インデックスベースのマップを使用して効率化
        const indexByValue = new Map();
        for (let i = 0; i < _oldListValue.length; i++) {
            // 重複値の場合は最後のインデックスが優先される（既存動作を維持）
            indexByValue.set(_oldListValue[i], i);
        }
        const adds = new Set();
        const removes = new Set();
        const changeIndexes = new Set();
        const newIndexes = [];
        const usedOldIndexes = new Set();
        for (let i = 0; i < _newListValue.length; i++) {
            const newValue = _newListValue[i];
            const oldIndex = indexByValue.get(newValue);
            if (oldIndex === undefined) {
                // 新しい要素
                const newListIndex = createListIndex(parentListIndex, i);
                adds.add(newListIndex);
                newIndexes.push(newListIndex);
            }
            else {
                // 既存要素の再利用
                const existingListIndex = _oldIndexes[oldIndex];
                if (existingListIndex.index !== i) {
                    existingListIndex.index = i;
                    changeIndexes.add(existingListIndex);
                }
                usedOldIndexes.add(oldIndex);
                newIndexes.push(existingListIndex);
            }
        }
        // 使用されなかった古いインデックスを削除対象に追加
        for (let i = 0; i < _oldIndexes.length; i++) {
            if (!usedOldIndexes.has(i)) {
                removes.add(_oldIndexes[i]);
            }
        }
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes,
            adds,
            removes,
            changeIndexes,
        };
    }
}
