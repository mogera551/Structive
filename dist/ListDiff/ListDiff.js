import { createListIndex } from "../ListIndex/ListIndex";
export function calcListDiff(parentListIndex, oldListValue, newListValue, oldIndexes) {
    const _newListValue = newListValue || [];
    const _oldListValue = oldListValue || [];
    const _oldIndexes = oldIndexes || [];
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
        const listIndexByListValue = new Map();
        for (let i = 0; i < _oldListValue.length; i++) {
            listIndexByListValue.set(_oldListValue[i], _oldIndexes[i]);
        }
        const adds = new Set();
        const removes = new Set(oldIndexes);
        const overwrites = new Set();
        const changeIndexes = new Set();
        const newIndexes = [];
        for (let i = 0; i < _newListValue.length; i++) {
            const newValue = _newListValue[i];
            let newListIndex = listIndexByListValue.get(newValue);
            if (typeof newListIndex === "undefined") {
                newListIndex = createListIndex(parentListIndex, i);
                adds.add(newListIndex);
            }
            else {
                if (newListIndex.index !== i) {
                    newListIndex.index = i;
                    changeIndexes.add(newListIndex);
                }
                removes.delete(newListIndex);
            }
            newIndexes.push(newListIndex);
        }
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes,
            adds,
            removes,
            overwrites,
            changeIndexes,
        };
    }
}
