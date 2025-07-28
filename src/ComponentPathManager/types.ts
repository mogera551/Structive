import { IStructuredPathInfo } from "../StateProperty/types";

export interface IComponentPathInfo {
  path: string;
  info: IStructuredPathInfo;
  withGetter: boolean;
  withSetter: boolean;
  /**
   * getListPathsSetByIdから取得される
   */
  isList: boolean;
  /**
   * getPathsSetByIdから取得される
   */
  existsUI: boolean;
  isTracked: boolean;
  optimized: boolean; // 最適化されたパス情報かどうか
}

export interface IComponentPathManager {
  staticDependencies: Map<string, Set<string>>;
  dynamicDependencies: Map<string, Set<string>>;
  pathInfos: Map<string, IComponentPathInfo>;
  getters: Set<string>;
  trackedGetters: Set<string>;
  setters: Set<string>;
  UIs: Set<string>; // UIが存在するパスのセット
  lists: Set<string>; // リストパスのセット
  paths: Set<string>; // 全てのパスのセット

  addStaticDependency(path: string, dependency: string): void;
  addDynamicDependency(path: string, dependency: string): void;
  createPathInfo(path: string): IComponentPathInfo;
  getPathInfo(path: string): IComponentPathInfo;
}