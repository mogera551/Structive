import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes";
import { createAccessorFunctions } from "../StateProperty/createAccessorFunctions";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
class StatePathManager {
    alls = new Set();
    getters = new Set();
    lists = new Set();
    elements = new Set();
    staticDependencies = new Map();
    dynamicDependencies = new Map();
    constructor(templateId, stateClass) {
        const allPaths = getPathsSetById(templateId);
        for (const path of allPaths) {
            const info = getStructuredPathInfo(path);
            this.alls = this.alls.union(info.cumulativePathSet);
        }
        const listPaths = getListPathsSetById(templateId);
        for (const path of listPaths) {
            this.lists.add(path);
            this.elements.add(path + ".*");
        }
        let proto = Object.getPrototypeOf(stateClass);
        while (proto !== Object.prototype) {
            for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
                if (typeof descriptor.get === "function") {
                    this.getters.add(key);
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        // create optimize getter and static dependencies
        for (const path of this.alls) {
            const info = getStructuredPathInfo(path);
            if (info.parentPath === null)
                continue;
            this.addStaticDependency(path, info.parentPath);
            if (this.getters.has(path))
                continue;
            const descriptor = createAccessorFunctions(info, this.getters);
            Object.defineProperty(stateClass.prototype, path, {
                get: descriptor.get,
                set: descriptor.set,
                enumerable: true,
                configurable: true,
            });
        }
    }
    addStaticDependency(from, refto) {
        const paths = this.staticDependencies.get(refto);
        if (paths === undefined) {
            this.staticDependencies.set(refto, new Set([from]));
        }
        else {
            paths.add(from);
        }
    }
    addDynamicDependency(from, refto) {
        const paths = this.dynamicDependencies.get(refto);
        if (paths === undefined) {
            this.dynamicDependencies.set(refto, new Set([from]));
        }
        else {
            paths.add(from);
        }
    }
}
export function createStatePathManager(templateId, stateClass) {
    return new StatePathManager(templateId, stateClass);
}
