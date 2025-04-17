import { createListIndex } from "../ListIndex/createListIndex";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { GetByRefSymbol } from "./symbols";

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
  const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
  const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
  const newListIndexesSet:Set<IListIndex> = new Set();
  for(let i = 0; i < value.length; i++) {
    const item = value[i];
    const oldListIndexes = oldListIndexesByItem.get(item);
    let curListIndex = oldListIndexes?.shift();
    if (!curListIndex) {
      curListIndex = createListIndex(listIndex, i);
    } else {
      if (curListIndex.index !== i) {
        curListIndex.index = i;
        engine.updater.addUpdatedListIndex(curListIndex);
      }
    }
    newListIndexesSet.add(curListIndex);
  }
  engine.saveListIndexesSet(info, listIndex, newListIndexesSet);
  engine.saveList(info, listIndex, value.slice(0));

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
