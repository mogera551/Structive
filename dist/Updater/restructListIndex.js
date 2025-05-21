import { createDependencyWalker } from "../DependencyWalker/createDependencyWalker";
import { createListIndex } from "../ListIndex/createListIndex";
import { listWalker } from "../ListWalker/listWalker";
import { GetByRefSymbol } from "../StateClass/symbols";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { config } from "../WebComponents/getGlobalConfig";
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
    for (const { info, listIndex } of infos) {
        if (config.optimizeListElements && engine.elementInfoSet.has(info)) {
            // スワップ処理のためスキップ
            continue;
        }
        const dependentWalker = createDependencyWalker(engine, { info, listIndex });
        const nowOnList = config.optimizeList && engine.listInfoSet.has(info);
        dependentWalker.walk((ref, refInfo, type) => {
            if (nowOnList && type === "structured" && ref.info !== refInfo) {
                if (refInfo.cumulativeInfoSet.has(ref.info)) {
                    return;
                }
            }
            const wildcardMatchPaths = Array.from(ref.info.wildcardInfoSet.intersection(refInfo.wildcardInfoSet));
            const longestMatchAt = (wildcardMatchPaths.at(-1)?.wildcardCount ?? 0) - 1;
            const listIndex = (longestMatchAt >= 0) ? (ref.listIndex?.at(longestMatchAt) ?? null) : null;
            listWalker(engine, refInfo, listIndex, (_info, _listIndex) => {
                if (!engine.existsBindingsByInfo(_info)) {
                    return;
                }
                const refKey = createRefKey(_info, _listIndex);
                if (refKeys.has(refKey)) {
                    return;
                }
                let cacheListIndexSet = cache.get(_info);
                if (!cacheListIndexSet) {
                    cacheListIndexSet = new Set();
                    cache.set(_info, cacheListIndexSet);
                }
                cacheListIndexSet.add(_listIndex);
                refKeys.add(refKey);
                if (engine.listInfoSet.has(_info)) {
                    const values = updateValues[refKey] ?? engine.readonlyState[GetByRefSymbol](_info, _listIndex);
                    buildListIndexTree(engine, _info, _listIndex, values);
                }
            });
        });
    }
}
