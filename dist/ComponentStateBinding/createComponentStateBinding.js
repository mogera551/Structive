import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { raiseError } from "../utils";
class ComponentStateBinding {
    parentPaths = new Set();
    childPaths = new Set();
    childPathByParentPath = new Map();
    parentPathByChildPath = new Map();
    bindingByParentPath = new Map();
    bindingByChildPath = new Map();
    bindings = new WeakSet();
    addBinding(binding) {
        if (this.bindings.has(binding)) {
            return; // 既にバインディングが追加されている場合は何もしない
        }
        const parentPath = binding.bindingState.pattern;
        const childPath = binding.bindingNode.subName;
        if (this.childPathByParentPath.has(parentPath)) {
            raiseError({
                code: "STATE-303",
                message: `Parent path "${parentPath}" already has a child path`,
                context: { parentPath, existingChildPath: this.childPathByParentPath.get(parentPath) },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        if (this.parentPathByChildPath.has(childPath)) {
            raiseError({
                code: "STATE-303",
                message: `Child path "${childPath}" already has a parent path`,
                context: { childPath, existingParentPath: this.parentPathByChildPath.get(childPath) },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        this.childPathByParentPath.set(parentPath, childPath);
        this.parentPathByChildPath.set(childPath, parentPath);
        this.parentPaths.add(parentPath);
        this.childPaths.add(childPath);
        this.bindingByParentPath.set(parentPath, binding);
        this.bindingByChildPath.set(childPath, binding);
        this.bindings.add(binding);
    }
    getChildPath(parentPath) {
        return this.childPathByParentPath.get(parentPath);
    }
    getParentPath(childPath) {
        return this.parentPathByChildPath.get(childPath);
    }
    toParentPathFromChildPath(childPath) {
        const childPathInfo = getStructuredPathInfo(childPath);
        const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
        if (matchPaths.size === 0) {
            raiseError({
                code: "STATE-302",
                message: `No parent path found for child path "${childPath}"`,
                context: { childPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        const matchPathArray = Array.from(matchPaths);
        const longestMatchPath = matchPathArray[matchPathArray.length - 1];
        const remainPath = childPath.slice(longestMatchPath.length); // include the dot
        const matchParentPath = this.parentPathByChildPath.get(longestMatchPath);
        if (typeof matchParentPath === "undefined") {
            raiseError({
                code: "STATE-302",
                message: `No parent path found for child path "${childPath}"`,
                context: { childPath, longestMatchPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        return matchParentPath + remainPath;
    }
    toChildPathFromParentPath(parentPath) {
        const parentPathInfo = getStructuredPathInfo(parentPath);
        const matchPaths = parentPathInfo.cumulativePathSet.intersection(this.parentPaths);
        if (matchPaths.size === 0) {
            raiseError({
                code: "STATE-302",
                message: `No child path found for parent path "${parentPath}"`,
                context: { parentPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        const matchPathArray = Array.from(matchPaths);
        const longestMatchPath = matchPathArray[matchPathArray.length - 1];
        const remainPath = parentPath.slice(longestMatchPath.length); // include the dot
        const matchChildPath = this.childPathByParentPath.get(longestMatchPath);
        if (typeof matchChildPath === "undefined") {
            raiseError({
                code: "STATE-302",
                message: `No child path found for parent path "${parentPath}"`,
                context: { parentPath, longestMatchPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        return matchChildPath + remainPath;
    }
    startsWithByChildPath(childPathInfo) {
        if (this.childPaths.size === 0) {
            return null;
        }
        const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
        if (matchPaths.size === 0) {
            return null;
        }
        else {
            const matches = Array.from(matchPaths);
            const longestMatchPath = matches[matches.length - 1];
            return longestMatchPath;
        }
    }
    bind(parentComponent, childComponent) {
        // bindParentComponent
        const bindings = parentComponent.getBindingsFromChild(childComponent);
        for (const binding of bindings ?? []) {
            this.addBinding(binding);
        }
    }
}
export function createComponentStateBinding() {
    return new ComponentStateBinding();
}
