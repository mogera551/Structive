import { createDependencyWalker } from "../DependencyWalker/createDependencyWalker";
import { createListIndex } from "../ListIndex/createListIndex";
import { listWalker } from "../ListWalker/listWalker";
import { GetByRefSymbol } from "../StateClass/symbols";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
const BLANK_LISTINDEXES_SET = new Set();
function buildListIndexTree(engine, info, listIndex, value) {
    const oldValue = engine.getList(info, listIndex) ?? [];
    if (oldValue === value) {
        return;
    }
    const newListIndexesSet = new Set();
    const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
    const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
    for (let i = 0; i < value.length; i++) {
        // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
        // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
        let curListIndex = oldListIndexesByItem.get(value[i])?.shift() ?? createListIndex(listIndex, i);
        if (curListIndex.index !== i) {
            curListIndex.index = i;
            // リストインデックスのインデックスを更新したので、リストインデックスを登録する
            engine.updater.addUpdatedListIndex(curListIndex);
        }
        // リストインデックスを新しいリストインデックスセットに追加する
        newListIndexesSet.add(curListIndex);
    }
    // 新しいリストインデックスセットを保存する
    engine.saveListIndexesSet(info, listIndex, newListIndexesSet);
    engine.saveList(info, listIndex, value.slice(0)); // コピーを保存
}
export function restructListIndexes(infos, engine, updateValues, refKeys, cache) {
    const skipInfoSet = new Set();
    for (const { info, listIndex } of infos) {
        const dependentWalker = createDependencyWalker(engine, { info, listIndex });
        const nowOnList = engine.listInfoSet.has(info);
        dependentWalker.walk((ref, info) => {
            const wildcardMatchPaths = Array.from(ref.info.wildcardInfoSet.intersection(info.wildcardInfoSet));
            const longestMatchAt = (wildcardMatchPaths.at(-1)?.wildcardCount ?? 0) - 1;
            const listIndex = (longestMatchAt >= 0) ? (ref.listIndex?.at(longestMatchAt) ?? null) : null;
            if (skipInfoSet.has(info)) {
                return;
            }
            if (nowOnList && info !== ref.info) {
                if (info.cumulativeInfoSet.has(ref.info)) {
                    skipInfoSet.add(info);
                    return;
                }
            }
            listWalker(engine, info, listIndex, (_info, _listIndex) => {
                if (!engine.existsBindingsByInfo(_info)) {
                    return;
                }
                const refKey = createRefKey(_info, _listIndex);
                if (refKeys.has(refKey)) {
                    return;
                }
                let cacheListIndexSet = cache.get(info);
                if (!cacheListIndexSet) {
                    cacheListIndexSet = new Set();
                    cache.set(info, cacheListIndexSet);
                }
                cacheListIndexSet.add(_listIndex);
                refKeys.add(refKey);
                if (engine.listInfoSet.has(_info)) {
                    const values = updateValues[refKey] ?? engine.stateProxy[GetByRefSymbol](_info, _listIndex);
                    buildListIndexTree(engine, _info, _listIndex, values);
                }
            });
        });
    }
}
