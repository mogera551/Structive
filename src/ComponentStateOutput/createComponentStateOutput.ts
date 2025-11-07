import { IComponentEngine } from "../ComponentEngine/types";
import { IComponentStateBinding } from "../ComponentStateBinding/types";
import { IListIndex } from "../ListIndex/types";
import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { createUpdater } from "../Updater/Updater";
import { raiseError } from "../utils";
import { IComponentStateOutput } from "./types";

class ComponentStateOutput implements IComponentStateOutput {
  binding: IComponentStateBinding;
  childEngine: IComponentEngine;
  #parentPaths: Set<string> = new Set<string>();
  constructor(binding: IComponentStateBinding, childEngine: IComponentEngine) {
    this.binding = binding;
    this.childEngine = childEngine;
  }

  get(ref: IStatePropertyRef): any {
    const childPath = this.binding.startsWithByChildPath(ref.info);
    if (childPath === null) {
      raiseError(`No child path found for path "${ref.info.toString()}".`);
    }
    const parentBinding = this.binding.bindingByChildPath.get(childPath);
    if (typeof parentBinding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPath = this.binding.toParentPathFromChildPath(ref.info.pattern);
    const parentInfo = getStructuredPathInfo(parentPath);
    const parentRef = getStatePropertyRef(parentInfo, ref.listIndex ?? parentBinding.bindingState.listIndex);
    if (!this.#parentPaths.has(parentRef.info.pattern)) {
      const isList = this.childEngine.pathManager.lists.has(ref.info.pattern);
      parentBinding.engine.pathManager.addPath(parentRef.info.pattern, isList);
      this.#parentPaths.add(parentRef.info.pattern);
    }
    return parentBinding.engine.getPropertyValue(parentRef);
  }

  set(ref: IStatePropertyRef, value: any): boolean {
    const childPath = this.binding.startsWithByChildPath(ref.info);
    if (childPath === null) {
      raiseError(`No child path found for path "${ref.info.toString()}".`);
    }
    const parentBinding = this.binding.bindingByChildPath.get(childPath);
    if (typeof parentBinding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPath = this.binding.toParentPathFromChildPath(ref.info.pattern);
    const parentInfo = getStructuredPathInfo(parentPath);
    const parentRef = getStatePropertyRef(parentInfo, ref.listIndex ?? parentBinding.bindingState.listIndex);
    if (!this.#parentPaths.has(parentRef.info.pattern)) {
      const isList = this.childEngine.pathManager.lists.has(ref.info.pattern);
      parentBinding.engine.pathManager.addPath(parentRef.info.pattern, isList);
      this.#parentPaths.add(parentRef.info.pattern);
    }
    parentBinding.engine.setPropertyValue(parentRef, value);
    return true;
  }

  startsWith(pathInfo: IStructuredPathInfo): boolean {
    return this.binding.startsWithByChildPath(pathInfo) !== null;
  }

  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null {
    const childPath = this.binding.startsWithByChildPath(ref.info);
    if (childPath === null) {
      raiseError(`No child path found for path "${ref.info.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(ref.info.pattern));
    const parentRef = getStatePropertyRef(parentPathInfo, ref.listIndex);
    return binding.engine.getListIndexes(parentRef);
  }
}

export function createComponentStateOutput(binding: IComponentStateBinding, childEngine: IComponentEngine): IComponentStateOutput {
  return new ComponentStateOutput(binding, childEngine);
}