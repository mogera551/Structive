import { IComponentStateBinding } from "../ComponentStateBinding/types";
import { IListIndex } from "../ListIndex/types";
import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { update } from "../Updater/Updater";
import { raiseError } from "../utils";
import { IComponentStateOutput } from "./types";

class ComponentStateOutput implements IComponentStateOutput {
  binding: IComponentStateBinding;
  constructor(binding: IComponentStateBinding) {
    this.binding = binding;
  }

  get(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null): any {
    const childPath = this.binding.startsWithByChildPath(pathInfo);
    if (childPath === null) {
      raiseError(`No child path found for path "${pathInfo.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
    return binding.engine.getPropertyValue(parentPathInfo, listIndex ?? binding.bindingState.listIndex);
  }

  set(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null, value: any): boolean {
    const childPath = this.binding.startsWithByChildPath(pathInfo);
    if (childPath === null) {
      raiseError(`No child path found for path "${pathInfo.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
    const engine = binding.engine;
    const ref = getStatePropertyRef(parentPathInfo, listIndex ?? binding.bindingState.listIndex);
    update(engine, null, async (updater, stateProxy) => {
      stateProxy[SetByRefSymbol](ref, value);
    });
    return true;
  }

  startsWith(pathInfo: IStructuredPathInfo): boolean {
    return this.binding.startsWithByChildPath(pathInfo) !== null;
  }

  getListIndexes(pathInfo:IStructuredPathInfo, listIndex:IListIndex | null): IListIndex[] | null {
    const childPath = this.binding.startsWithByChildPath(pathInfo);
    if (childPath === null) {
      raiseError(`No child path found for path "${pathInfo.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
    return binding.engine.getListIndexes(parentPathInfo, listIndex);
  }
}

export function createComponentStateOutput(binding: IComponentStateBinding): IComponentStateOutput {
  return new ComponentStateOutput(binding);
}