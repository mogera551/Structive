import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

function extractListIndexes(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  engine: IComponentEngine,
): IListIndex[] {
  const wildcardParentInfos: IStructuredPathInfo[] = info.wildcardParentInfos ?? [];
  const _extractListIndexes = (pos:number, currentListIndex: IListIndex | null, resultListIndexes: IListIndex[]) => {
    const wildcardParentInfo = wildcardParentInfos[pos];
    if (!wildcardParentInfo) {
      if (currentListIndex) {
        resultListIndexes.push(currentListIndex);
      }
      return;
    }
    const subListIndex = listIndex?.at(pos) ?? null;
    if (subListIndex) {
      _extractListIndexes(pos + 1, subListIndex, resultListIndexes);
    } else {
      const listIndexes = engine.getListIndexesSet(wildcardParentInfo, currentListIndex);
      for(const loopListIndex of listIndexes ?? []) {
        _extractListIndexes(pos + 1, loopListIndex, resultListIndexes);
      }
    }
  }
  const resultListIndexes: IListIndex[] = [];
  _extractListIndexes(0, listIndex, resultListIndexes);
  return resultListIndexes;
}

function _collectAffectedGetters(
  refInfo        : IStructuredPathInfo,
  refListIndex   : IListIndex | null,
  engine         : IComponentEngine,
  resultPathInfos: Set<IStructuredPathInfo>,
  resultRefs     : {info:IStructuredPathInfo, listIndex:IListIndex | null}[],
) {
//  if (engine.listInfoSet.has(refInfo)) return;
  if (resultPathInfos.has(refInfo)) return;
  const dependentPathInfos = engine.dependentTree.get(refInfo);
  for(const dependentPathInfo of dependentPathInfos ?? []) {
    if (engine.listInfoSet.has(refInfo) && dependentPathInfo.parentInfo === refInfo && dependentPathInfo.lastSegment === "*") {
      continue;
    }
    let dependentListIndex = null;
    let updateList = false;
    for(let i = dependentPathInfo.wildcardParentInfos.length - 1; i >= 0; i--) {
      const wildcardParentInfo = dependentPathInfo.wildcardParentInfos[i];
      if (resultPathInfos.has(wildcardParentInfo)) {
        updateList = true;
        break;
      }
      const pos = refInfo.wildcardParentInfos.indexOf(wildcardParentInfo);
      if (pos < 0) continue;
      dependentListIndex = refListIndex?.at(pos) ?? null;
      if (dependentListIndex !== null) break;
    }
    if (updateList) {
      continue;
    }
    if (dependentPathInfo.wildcardParentInfos.length > 0) {
      const extractlistIndexes = extractListIndexes(dependentPathInfo, dependentListIndex, engine);
      for(const listIndex of extractlistIndexes) {
        resultRefs.push({info: dependentPathInfo, listIndex});
        _collectAffectedGetters(dependentPathInfo, listIndex, engine, resultPathInfos, resultRefs);
      }
    } else {
      resultRefs.push({info: dependentPathInfo, listIndex: null});
      _collectAffectedGetters(dependentPathInfo, null, engine, resultPathInfos, resultRefs);
    }

  }

}


export function collectAffectedGetters(
  updateRefs: {info:IStructuredPathInfo, listIndex:IListIndex | null}[],
  engine: IComponentEngine,
): {info:IStructuredPathInfo, listIndex:IListIndex | null}[] {
  const resultPathInfos = new Set<IStructuredPathInfo>();
  const resultRefs: {info:IStructuredPathInfo, listIndex:IListIndex | null}[] = [];
  for(const ref of updateRefs) {
    const info = ref.info;
    const listIndex = ref.listIndex;
    if (resultPathInfos.has(info)) continue;
    _collectAffectedGetters(info, listIndex, engine, resultPathInfos, resultRefs);
    resultPathInfos.add(info);
  }
  return resultRefs;

}

