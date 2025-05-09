import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { buildListIndexTree } from "../StateClass/buildListIndexTree";
import { GetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRefId } from "../StatePropertyRef/getStatePropertyRefId";

export function restructListIndex(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  engine: IComponentEngine,
  updateValues: {[key:number]: any[]},
  refIds: Set<number> = new Set()

) {
  const refId = getStatePropertyRefId(info, listIndex);
  if (refIds.has(refId)) {
    return;
  }
  const curListIndexLen = listIndex?.length ?? 0;
  if (curListIndexLen < info.wildcardCount) {
    const wildcardInfo = info.wildcardInfos[curListIndexLen];
    const listIndexSet = engine.getListIndexesSet(wildcardInfo, listIndex)    
    for(const curlistIndex of listIndexSet ?? []) {
      restructListIndex(info, curlistIndex, engine, updateValues, refIds);
    }
  } else {
    if (engine.listInfoSet.has(info)) {
      refIds.add(refId);
      const values = updateValues[refId] ?? engine.stateProxy[GetByRefSymbol](info, listIndex);
      buildListIndexTree(engine, info, listIndex, values);
    }
    const infoSub = getStructuredPathInfo(info.pattern + ".*");
    for(const refInfo of engine.dependentTree.get(info) ?? []) {
      if (refInfo.cumulativeInfos.includes(infoSub)) {
        continue;
      }
      // ここにサブは来ない
      restructListIndex(refInfo, null, engine, updateValues, refIds);
    }
  }
}

export function restructListIndexes(
  infos: {info: IStructuredPathInfo, listIndex: IListIndex | null}[],
  engine: IComponentEngine,
  updateValues: {[key:number]: any[]},
  refIds: Set<number>
) {
  for(const {info, listIndex} of infos) {
    restructListIndex(info, listIndex, engine, updateValues, refIds);
  }
}