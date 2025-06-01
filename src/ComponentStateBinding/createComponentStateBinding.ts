import { IBinding } from "../DataBinding/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { IComponentStateBinding } from "./types";

class ComponentStateBinding implements IComponentStateBinding {
  parentPaths: Set<string> = new Set<string>();
  childPaths: Set<string> = new Set<string>();
  childPathByParentPath: Map<string, string> = new Map();
  parentPathByChildPath: Map<string, string> = new Map();
  bindingByParentPath: Map<string, IBinding> = new Map();
  bindingByChildPath: Map<string, IBinding> = new Map();

  addBinding(binding: IBinding): void {
    const parentPath = binding.bindingState.pattern;
    const childPath = binding.bindingNode.subName;
    this.add(parentPath, childPath);
    this.bindingByParentPath.set(parentPath, binding);
    this.bindingByChildPath.set(childPath, binding);
  }
  
  add(parentPath: string, childPath: string): void {
    if (this.childPathByParentPath.has(parentPath)) {
      throw new Error(`Parent path "${parentPath}" already has a child path.`);
    }
    if (this.parentPathByChildPath.has(childPath)) {
      throw new Error(`Child path "${childPath}" already has a parent path.`);
    }
    this.childPathByParentPath.set(parentPath, childPath);
    this.parentPathByChildPath.set(childPath, parentPath);
    this.parentPaths.add(parentPath);
    this.childPaths.add(childPath);
  }

  getChildPath(parentPath: string): string | undefined {
    return this.childPathByParentPath.get(parentPath);
  }

  getParentPath(childPath: string): string | undefined {
    return this.parentPathByChildPath.get(childPath);
  }

  toParentPathFromChildPath(childPath: string): string {
    const childPathInfo = getStructuredPathInfo(childPath);
    const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
    if (matchPaths.size === 0) {
      raiseError(`No parent path found for child path "${childPath}".`);
    }
    const matchPathArray = Array.from(matchPaths);
    const longestMatchPath = matchPathArray[matchPathArray.length - 1];
    const remainPath = childPath.slice(longestMatchPath.length); // include the dot
    const matchParentPath = this.parentPathByChildPath.get(longestMatchPath);
    if (typeof matchParentPath === "undefined") {
      raiseError(`No parent path found for child path "${childPath}".`);
    }
    return matchParentPath + remainPath;
  }

  toChildPathFromParentPath(parentPath: string): string {
     const parentPathInfo = getStructuredPathInfo(parentPath);
    const matchPaths = parentPathInfo.cumulativePathSet.intersection(this.parentPaths);
    if (matchPaths.size === 0) {
      raiseError(`No child path found for parent path "${parentPath}".`);
    }
    const matchPathArray = Array.from(matchPaths);
    const longestMatchPath = matchPathArray[matchPathArray.length - 1];
    const remainPath = parentPath.slice(longestMatchPath.length); // include the dot
    const matchChildPath = this.childPathByParentPath.get(longestMatchPath);
    if (typeof matchChildPath === "undefined") {
      raiseError(`No child path found for parent path "${parentPath}".`);
    }
    return matchChildPath + remainPath;
  }

  startsWithByChildPath(childPathInfo: IStructuredPathInfo): string | null {
    if (this.childPaths.size === 0) {
      return null;
    }
    const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
    if (matchPaths.size === 0) {
      return null;
    } else {
      const matches = Array.from(matchPaths);
      const longestMatchPath = matches[matches.length - 1];
      return longestMatchPath;
    }
  }
}

export function createComponentStateBinding(): IComponentStateBinding {
  return new ComponentStateBinding();
}