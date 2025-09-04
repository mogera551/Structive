import { GetByRefSymbol } from "./symbols.js";
import { createListIndex2 } from "../ListIndex2/ListIndex2.js";
const BLANK_LISTINDEXES_SET = new Set();
function buildListIndexTreeSub(engine, listInfos, info, listIndex, value) {
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
        let curListIndex = oldListIndexesByItem.get(value[i])?.shift() ?? createListIndex2(listIndex, i);
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
    // サブ要素のリストインデックスを構築する
    const searchPath = info.pattern + ".*";
    for (const info of listInfos) {
        if (searchPath !== info.lastWildcardPath) {
            continue;
        }
        for (const subListIndex of newListIndexesSet) {
            const subValue = engine.readonlyState[GetByRefSymbol](info, subListIndex);
            buildListIndexTreeSub(engine, listInfos, info, subListIndex, subValue ?? []);
        }
    }
}
export function buildListIndexTree(engine, info, listIndex, value) {
    const listInfos = engine.listInfoSet;
    // 配列じゃなければ何もしない
    if (!engine.listInfoSet.has(info)) {
        return;
    }
    const values = (value ?? []);
    buildListIndexTreeSub(engine, engine.listInfoSet, info, listIndex, values);
}
