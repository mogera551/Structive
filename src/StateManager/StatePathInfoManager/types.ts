import { IStructuredPathInfo } from "../../StateProperty/types";

export interface IStatePathInfoManager {
  all: Set<IStructuredPathInfo>;
  getters: Set<IStructuredPathInfo>;
  onlyGetters: Set<IStructuredPathInfo>;
  setters: Set<IStructuredPathInfo>;
  lists: Set<IStructuredPathInfo>;
  elements: Set<IStructuredPathInfo>;
  optimizedAccessor: Set<IStructuredPathInfo>;

  getterPaths: Set<string>;

  staticDependency: Map<IStructuredPathInfo, Set<IStructuredPathInfo>>;
  dynamicDependency: Map<IStructuredPathInfo, Set<IStructuredPathInfo>>;
  addStaticDependency(
    source: IStructuredPathInfo,
    reference: IStructuredPathInfo
  ): void;
  addDynamicDependency(
    source: IStructuredPathInfo,
    reference: IStructuredPathInfo
  ): void;
}