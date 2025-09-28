import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { update } from "../Updater/Updater";
import { raiseError } from "../utils";
class ComponentStateOutput {
    binding;
    constructor(binding) {
        this.binding = binding;
    }
    get(pathInfo, listIndex) {
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
    set(pathInfo, listIndex, value) {
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
    startsWith(pathInfo) {
        return this.binding.startsWithByChildPath(pathInfo) !== null;
    }
    getListIndexes(ref) {
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
export function createComponentStateOutput(binding) {
    return new ComponentStateOutput(binding);
}
