import { GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { raiseError } from "../utils";
class ComponentStateOutput {
    binding;
    constructor(binding) {
        this.binding = binding;
    }
    get(pathInfo) {
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
    set(pathInfo, value) {
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
    startsWith(pathInfo) {
        return this.binding.startsWithByChildPath(pathInfo) !== null;
    }
}
export function createComponentStateOutput(binding) {
    return new ComponentStateOutput(binding);
}
