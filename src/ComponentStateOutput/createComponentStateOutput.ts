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
  constructor(binding: IComponentStateBinding) {
    this.binding = binding;
  }

  get(ref: IStatePropertyRef): any {
    const childPath = this.binding.startsWithByChildPath(ref.info);
    if (childPath === null) {
      raiseError(`No child path found for path "${ref.info.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(ref.info.pattern));
    const parentRef = getStatePropertyRef(parentPathInfo, ref.listIndex ?? binding.bindingState.listIndex);
    return binding.engine.getPropertyValue(parentRef);
  }

  set(ref: IStatePropertyRef, value: any): boolean {
    const childPath = this.binding.startsWithByChildPath(ref.info);
    if (childPath === null) {
      raiseError(`No child path found for path "${ref.info.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(ref.info.pattern));
    const engine = binding.engine;
    const parentRef = getStatePropertyRef(parentPathInfo, ref.listIndex ?? binding.bindingState.listIndex);
    createUpdater(engine, (updater) => {
      updater.update(null, (stateProxy, handler) => {
        stateProxy[SetByRefSymbol](parentRef, value);
      });
    });
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

export function createComponentStateOutput(binding: IComponentStateBinding): IComponentStateOutput {
  return new ComponentStateOutput(binding);
}