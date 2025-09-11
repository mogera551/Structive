import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes";
import { createAccessorFunctions } from "../StateProperty/createAccessorFunctions";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
class PathManager {
    alls = new Set();
    lists = new Set();
    elements = new Set();
    getters = new Set();
    setters = new Set();
    optimizes = new Set();
    staticDependencies = new Map();
    dynamicDependencies = new Map();
    #id;
    #stateClass;
    constructor(componentClass) {
        this.#id = componentClass.id;
        this.#stateClass = componentClass.stateClass;
        const alls = getPathsSetById(this.#id);
        for (const path of alls) {
            const info = getStructuredPathInfo(path);
            this.alls = this.alls.union(info.cumulativePathSet);
        }
        const lists = getListPathsSetById(this.#id);
        this.lists = this.lists.union(lists);
        for (const listPath of lists) {
            const elementPath = listPath + ".*";
            this.elements.add(elementPath);
        }
        let currentProto = this.#stateClass.prototype;
        while (currentProto && currentProto !== Object.prototype) {
            const getters = Object.getOwnPropertyDescriptors(currentProto);
            if (getters) {
                for (const [key, desc] of Object.entries(getters)) {
                    const hasGetter = desc.get !== undefined;
                    const hasSetter = desc.set !== undefined;
                    const info = getStructuredPathInfo(key);
                    this.alls = this.alls.union(info.cumulativePathSet);
                    if (hasGetter) {
                        this.getters.add(key);
                    }
                    if (hasSetter) {
                        this.setters.add(key);
                    }
                }
            }
            currentProto = Object.getPrototypeOf(currentProto);
        }
        // 最適化対象のパスを決定し、最適化する
        for (const path of this.alls) {
            if (this.getters.has(path)) {
                continue;
            }
            if (this.setters.has(path)) {
                continue;
            }
            const info = getStructuredPathInfo(path);
            if (info.pathSegments.length === 1) {
                continue;
            }
            const funcs = createAccessorFunctions(info, this.getters);
            Object.defineProperty(this.#stateClass.prototype, path, {
                get: funcs.get,
                set: funcs.set,
                enumerable: true,
                configurable: true,
            });
            this.optimizes.add(path);
        }
        // 静的依存関係の設定
        for (const path of this.alls) {
            const info = getStructuredPathInfo(path);
            if (info.parentPath) {
                this.staticDependencies.get(info.parentPath)?.add(path) ??
                    this.staticDependencies.set(info.parentPath, new Set());
            }
        }
    }
    addDynamicDependency(target, source) {
        this.dynamicDependencies.get(source)?.add(target) ??
            this.dynamicDependencies.set(source, new Set([target]));
    }
}
export function createPathManager(componentClass) {
    return new PathManager(componentClass);
}
