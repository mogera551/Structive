import { createComponentPathInfo } from "./ComponentPathInfo";
import { IComponentPathInfo, IComponentPathManager } from "./types";

class ComponentPathManager implements IComponentPathManager {
  staticDependencies: Map<string, Set<string>>;
  dynamicDependencies: Map<string, Set<string>>;
  pathInfos: Map<string, IComponentPathInfo>;
  getters: Set<string> = new Set();
  trackedGetters: Set<string> = new Set();
  setters: Set<string> = new Set();
  UIs: Set<string> = new Set(); // UIが存在するパスのセット
  lists: Set<string> = new Set(); // リストパスのセット
  paths: Set<string> = new Set(); // 全てのパスのセット

  optimizedAccessor: boolean = false; // 最適化されたアクセサーの処理が終わったか
  setFromState: boolean = false; // setPathInfoFromStateの処理が終わったか
  setFromTemplate: boolean = false; // setPathInfoFromTemplateの処理が終わったか

  constructor() {
    this.staticDependencies = new Map<string, Set<string>>();
    this.dynamicDependencies = new Map<string, Set<string>>();
    this.pathInfos = new Map<string, IComponentPathInfo>();
  }

  addStaticDependency(path: string, dependency: string): void {
    let paths = this.staticDependencies.get(dependency);
    if (!paths) {
      paths = new Set<string>();
      this.staticDependencies.set(dependency, paths);
    }
    paths.add(path);
  }

  addDynamicDependency(path: string, dependency: string): void {
    let paths = this.dynamicDependencies.get(dependency);
    if (!paths) {
      paths = new Set<string>();
      this.dynamicDependencies.set(dependency, paths);
    }
    paths.add(path);
  }

  createPathInfo(path: string): IComponentPathInfo {
    const pathInfo = createComponentPathInfo(path);
    this.pathInfos.set(path, pathInfo);
    this.paths.add(path);
    if (pathInfo.info.pathSegments.length > 1) {
      this.addStaticDependency(path, pathInfo.info.parentPath || "");
    }
    return pathInfo;
  }

  getPathInfo(path: string): IComponentPathInfo {
    let pathInfo = this.pathInfos.get(path);
    if (!pathInfo) {
      pathInfo = this.createPathInfo(path);
    }
    return pathInfo;
  }
}

export function createComponentPathManager(): IComponentPathManager {
  return new ComponentPathManager();
}