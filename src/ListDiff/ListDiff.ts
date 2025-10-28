import { createListIndex } from "../ListIndex/ListIndex";
import { IListIndex } from "../ListIndex/types";
import { IListDiff } from "./types";

/**
 * 旧配列/新配列と旧インデックス配列から、追加・削除・位置変更・上書きの差分を計算します。
 *
 * 仕様ノート:
 * - adds: 新規に現れた要素のインデックス（新規 ListIndex を割り当て）
 * - removes: 旧配列で使用され、新配列で使われなくなったインデックス
 * - changeIndexes: 値を再利用しつつ位置が変わったインデックス（DOMの並べ替え対象）
 * - overwrites: 同じ位置に別の値が入った場合（再描画対象）
 *
 * 最適化ノート:
 * - 双方空や参照同一は早期return
 * - 片側空は全追加/全削除として扱う
 */
export function calcListDiff(
  parentListIndex: IListIndex | null,
  oldListValue: any[] | undefined | null,
  newListValue: any[] | undefined | null,
  oldIndexes: IListIndex[] | undefined | null,
): IListDiff {
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
      same: true,
    };
  }
  if (_newListValue.length === 0) {
    return {
      oldListValue,
      newListValue,
      oldIndexes: _oldIndexes,
      newIndexes: [],
      removes: new Set(_oldIndexes),
      same: false,
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
      same: false,
    };
  } else {
    // インデックスベースのマップを使用して効率化
    const indexByValue = new Map<any, number>();
    for(let i = 0; i < _oldListValue.length; i++) {
      // 重複値の場合は最後のインデックスが優先される（既存動作を維持）
      indexByValue.set(_oldListValue[i], i);
    }
    
    const adds = new Set<IListIndex>();
    const removes = new Set<IListIndex>();
    const changeIndexes = new Set<IListIndex>();
    let newIndexes: IListIndex[] = [];
    let usedOldIndexes = new Set<IListIndex>();
    let maybeSame = _oldListValue.length === _newListValue.length;
    
    // 新しい配列を走査し、追加・再利用・位置変更を判定
   
    for(let i = 0; i < _newListValue.length; i++) {
      const newValue = _newListValue[i];
      if (maybeSame) {
        if (newValue === _oldListValue[i]) {
          continue;
        }
        newIndexes = _oldIndexes.slice(0, i);
        usedOldIndexes = new Set(newIndexes);
        maybeSame = false;
      }
      const oldIndex = indexByValue.get(newValue);
      
      if (oldIndex === undefined) {
        // 新しい要素
        const newListIndex = createListIndex(parentListIndex, i);
        adds.add(newListIndex);
        newIndexes.push(newListIndex);
      } else {
        // 既存要素の再利用
        const existingListIndex = _oldIndexes[oldIndex];
        if (existingListIndex.index !== i) {
          existingListIndex.index = i;
          changeIndexes.add(existingListIndex);
        }
        usedOldIndexes.add(existingListIndex);
        newIndexes.push(existingListIndex);
      }
    }
    if (maybeSame) {
      // 参照同一だった場合
      return {
        oldListValue,
        newListValue,
        oldIndexes: _oldIndexes,
        newIndexes: _oldIndexes,
        same: true,
      };
    }
    
    // 使用されなかった古いインデックスを削除対象に追加
    for(let i = 0; i < _oldIndexes.length; i++) {
      const oldIndex = _oldIndexes[i];
      if (!usedOldIndexes.has(oldIndex)) {
        removes.add(oldIndex);
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
      same: false,
    };
  }
}
