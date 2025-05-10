import { createListIndex } from "../ListIndex/createListIndex.js";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { GetByRefSymbol } from "./symbols.js";

const BLANK_LISTINDEXES_SET = new Set<IListIndex>();

function buildListIndexTreeSub(
  engine   : IComponentEngine, 
  listInfos: Set<IStructuredPathInfo>,
  info     : IStructuredPathInfo,
  listIndex: IListIndex | null, 
  value: any[]
): void {
  const oldValue = engine.getList(info, listIndex) ?? [];
  if (oldValue === value) {
    return;
  }
  const newListIndexesSet:Set<IListIndex> = new Set();
  const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
  const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
  for(let i = 0; i < value.length; i++) {
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

  // サブ要素のリストインデックスを構築する
  const searchPath = info.pattern + ".*";
  for(const info of listInfos) {
    if (searchPath !== info.lastWildcardPath) {
      continue;
    }
    for(const subListIndex of newListIndexesSet) {
      const subValue = engine.stateProxy[GetByRefSymbol](info, subListIndex);
      buildListIndexTreeSub(
        engine, 
        listInfos, 
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
  listIndex: IListIndex | null, 
  value    : any
): void {
  const listInfos = engine.listInfoSet;
  // 配列じゃなければ何もしない
  if (!engine.listInfoSet.has(info)) {
    return;
  }
  const values = (value ?? []) as any[];
  buildListIndexTreeSub(
    engine, 
    engine.listInfoSet, 
    info, 
    listIndex, 
    values
  );
}
