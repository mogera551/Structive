import { createComponentPathInfo } from "./ComponentPathInfo";
class ComponentPathManager {
    staticDependencies;
    dynamicDependencies;
    pathInfos;
    getters = new Set();
    trackedGetters = new Set();
    setters = new Set();
    UIs = new Set(); // UIが存在するパスのセット
    lists = new Set(); // リストパスのセット
    paths = new Set(); // 全てのパスのセット
    elements = new Set(); // リスト要素パスのセット
    optimizedAccessor = false; // 最適化されたアクセサーの処理が終わったか
    setFromState = false; // setPathInfoFromStateの処理が終わったか
    setFromTemplate = false; // setPathInfoFromTemplateの処理が終わったか
    constructor() {
        this.staticDependencies = new Map();
        this.dynamicDependencies = new Map();
        this.pathInfos = new Map();
    }
    addStaticDependency(path, dependency) {
        let paths = this.staticDependencies.get(dependency);
        if (!paths) {
            paths = new Set();
            this.staticDependencies.set(dependency, paths);
        }
        paths.add(path);
    }
    addDynamicDependency(path, dependency) {
        let paths = this.dynamicDependencies.get(dependency);
        if (!paths) {
            paths = new Set();
            this.dynamicDependencies.set(dependency, paths);
        }
        paths.add(path);
    }
    createPathInfo(path) {
        const pathInfo = createComponentPathInfo(path);
        this.pathInfos.set(path, pathInfo);
        this.paths.add(path);
        if (pathInfo.info.pathSegments.length > 1) {
            this.addStaticDependency(path, pathInfo.info.parentPath || "");
        }
        return pathInfo;
    }
    getPathInfo(path) {
        let pathInfo = this.pathInfos.get(path);
        if (!pathInfo) {
            pathInfo = this.createPathInfo(path);
        }
        return pathInfo;
    }
    existsPathInfo(path) {
        return this.pathInfos.has(path);
    }
}
export function createComponentPathManager() {
    return new ComponentPathManager();
}
