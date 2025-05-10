import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";

function listWalkerSub(
  engine: IComponentEngine,
  info: IStructuredPathInfo, 
  listIndex: IListIndex | null, 
  callback:(info: IStructuredPathInfo, listIndex: IListIndex | null)=> void
) {
  const listIndexLen = listIndex?.length ?? 0;
  if (info.wildcardCount === listIndexLen) {
    callback(info, listIndex);
  } else {
    const parentInfo = info.wildcardParentInfos[listIndexLen] ?? raiseError("Invalid state property info");
    const listIndexes = engine.getListIndexesSet(parentInfo, listIndex);
    for(const subListIndex of listIndexes ?? []) {
      listWalkerSub(engine, info, subListIndex, callback);
    }
  }
}

export function listWalker(
  engine: IComponentEngine,
  info:IStructuredPathInfo, 
  listIndex: IListIndex | null,
  callback:(info: IStructuredPathInfo, listIndex: IListIndex | null)=> void
) {
  listWalkerSub(engine, info, listIndex, callback);
}
