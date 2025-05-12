import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IDependencyWalker {
  walk(
    callback: (ref: { info: IStructuredPathInfo, listIndex: IListIndex | null }, info: IStructuredPathInfo) => void
  ): void;
}

export type DependencyType = "structured" | "reference";

export interface IDependencyEdge {
  info: IStructuredPathInfo;
  type: DependencyType;
}
