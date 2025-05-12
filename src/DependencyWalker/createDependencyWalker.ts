import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { createDependencyKey } from "./createDependencyEdge";
import { DependencyType } from "./types";

class dependencyWalker {
  engine: IComponentEngine;
  entryRef: { info: IStructuredPathInfo, listIndex: IListIndex | null };
  traced: Set<string> = new Set<string>();
  constructor(
    engine: IComponentEngine,
    entryRef: { info: IStructuredPathInfo, listIndex: IListIndex | null },
  ) {
    this.engine = engine;
    this.entryRef = entryRef;
  }

  walkSub(
    info: IStructuredPathInfo,
    type: DependencyType,
    callback: (ref: IStatePropertyRef, info: IStructuredPathInfo, type: DependencyType) => void
  ) {
    const key = createDependencyKey(info, type);
    if (this.traced.has(key)) {
      return;
    }
    this.traced.add(key);
    callback(this.entryRef, info, type);
    const edges = this.engine.dependentTree.get(info) ?? [];
    for(const edge of edges) {
      const overridedType = edge.type === "structured" ? type : edge.type;
      this.walkSub(edge.info, overridedType, callback);
    }

  }
  walk(
    callback: (ref: IStatePropertyRef, info: IStructuredPathInfo, type: DependencyType) => void
  ) {
    const traced = new Set<IStructuredPathInfo>();
    this.walkSub(this.entryRef.info, "structured", callback);
  } 

}

export function createDependencyWalker(
  engine: IComponentEngine,
  entryRef: { info: IStructuredPathInfo, listIndex: IListIndex | null },
) {
  return new dependencyWalker(engine, entryRef);
}