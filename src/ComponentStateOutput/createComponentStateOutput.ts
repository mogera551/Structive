import { IComponentStateBinding } from "../ComponentStateBinding/types";
import { GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { IComponentStateOutput } from "./types";

class ComponentStateOutput implements IComponentStateOutput {
  binding: IComponentStateBinding;
  constructor(binding: IComponentStateBinding) {
    this.binding = binding;
  }

  get(pathInfo: IStructuredPathInfo): any {
    const childPath = this.binding.startsWithByChildPath(pathInfo);
    if (childPath === null) {
      raiseError(`No child path found for path "${pathInfo.toString()}".`);
    }
    const binding = this.binding.bindingByChildPath.get(childPath);
    if (typeof binding === "undefined") {
      raiseError(`No binding found for child path "${childPath}".`);
    }
    const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
    return binding.engine.readonlyState[GetByRefSymbol](parentPathInfo, binding.bindingState.listIndex);
  }

  set(pathInfo: IStructuredPathInfo, value: any): void {
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
    engine.useWritableStateProxy(null, async (state) => {
      state[SetByRefSymbol](parentPathInfo, binding.bindingState.listIndex, value);
    });
  }

  startsWith(pathInfo: IStructuredPathInfo): boolean {
    return this.binding.startsWithByChildPath(pathInfo) !== null;
  }
}

export function createComponentStateOutput(binding: IComponentStateBinding): IComponentStateOutput {
  return new ComponentStateOutput(binding);
}