import { IComponentEngine } from "../ComponentEngine/types";
import { createListIndex } from "../ListIndex/ListIndex";
import { IListIndex } from "../ListIndex/types";
import { IListDiff } from "./types";

export function calcListDiff(
  parentListIndex: IListIndex | null,
  oldListValue: any[] | undefined | null,
  newListValue: any[] | undefined | null,
  oldIndexes: IListIndex[] | undefined | null,
): IListDiff {
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
  } else if (_oldListValue.length === 0) {
    const newIndexes = [];
    for(let i = 0; i< _newListValue.length; i++) {
      newIndexes.push(createListIndex(parentListIndex, i));
    }
    return {
      oldListValue,
      newListValue,
      oldIndexes: _oldIndexes,
      newIndexes,
      adds: new Set(newIndexes),
    };
  } else {
    const listIndexByListValue = new Map<any, IListIndex>();
    for(let i = 0; i< _oldListValue.length; i++) {
      listIndexByListValue.set(_oldListValue[i], _oldIndexes[i]);
    }
    const adds = new Set<IListIndex>();
    const removes = new Set<IListIndex>(oldIndexes);
    const overwrites = new Set<IListIndex>();
    const changeIndexes = new Set<IListIndex>();
    const newIndexes: IListIndex[] = [];
    for(let i = 0; i< _newListValue.length; i++) {
      const newValue = _newListValue[i];
      let newListIndex = listIndexByListValue.get(newValue);
      if (typeof newListIndex === "undefined") {
        newListIndex = createListIndex(parentListIndex, i);
        adds.add(newListIndex);
      } else {
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
