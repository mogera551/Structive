import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

class dependencyWalker {
  engine: IComponentEngine;
  entryRef: { info: IStructuredPathInfo, listIndex: IListIndex | null };
  traced: Set<IStructuredPathInfo> = new Set<IStructuredPathInfo>();
  constructor(
    engine: IComponentEngine,
    entryRef: { info: IStructuredPathInfo, listIndex: IListIndex | null },
  ) {
    this.engine = engine;
    this.entryRef = entryRef;
  }

  walkSub(
    info: IStructuredPathInfo,
    callback: (ref: { info: IStructuredPathInfo, listIndex: IListIndex | null }, info: IStructuredPathInfo) => void
  ) {
    if (this.traced.has(info)) {
      return;
    }
    this.traced.add(info);
    callback(this.entryRef, info);
    const refs = this.engine.dependentTree.get(info) ?? [];
    for(const ref of refs) {
      this.walkSub(ref, callback);
    }

  }
  walk(
    callback: (ref: { info: IStructuredPathInfo, listIndex: IListIndex | null }, info: IStructuredPathInfo) => void
  ) {
    const traced = new Set<IStructuredPathInfo>();
    this.walkSub(this.entryRef.info, callback);
  } 

}

export function createDependencyWalker(
  engine: IComponentEngine,
  entryRef: { info: IStructuredPathInfo, listIndex: IListIndex | null },
) {
  return new dependencyWalker(engine, entryRef);
}