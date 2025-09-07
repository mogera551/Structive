import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { GetByRefSymbol } from "./symbols.js";
import { IListIndex2 } from "../ListIndex2/types.js";
import { createListIndex2 } from "../ListIndex2/ListIndex2.js";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";

const BLANK_LISTINDEXES_SET = new Set<IListIndex2>();

function buildListIndexTreeSub(
  engine   : IComponentEngine, 
  lists: Set<string>,
  info     : IStructuredPathInfo,
  listIndex: IListIndex2 | null, 
  value: any[]
): void {
  const oldValue = engine.getList(info, listIndex) ?? [];
  if (oldValue === value) {
    return;
  }
  const newListIndexesSet:Set<IListIndex2> = new Set();
  const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
  const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
  for(let i = 0; i < value.length; i++) {
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
  for(const path of lists) {
    const info = getStructuredPathInfo(path);
    if (searchPath !== info.lastWildcardPath) {
      continue;
    }
    for(const subListIndex of newListIndexesSet) {
      const subValue = engine.readonlyState[GetByRefSymbol](info, subListIndex);
      buildListIndexTreeSub(
        engine, 
        lists, 
        info, 
        subListIndex, 
        subValue ?? []
      );
    }
  }
}


export function buildListIndexTree(
  engine   : IComponentEngine, 
  info     : IStructuredPathInfo,
  listIndex: IListIndex2 | null, 
  value    : any
): void {
  // 配列じゃなければ何もしない
  if (!engine.pathManager.lists.has(info.pattern)) {
    return;
  }
  const values = (value ?? []) as any[];
  buildListIndexTreeSub(
    engine, 
    engine.pathManager.lists, 
    info, 
    listIndex, 
    values
  );
}
