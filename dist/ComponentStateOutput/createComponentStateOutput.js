import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { createUpdater } from "../Updater/Updater";
import { raiseError } from "../utils";
class ComponentStateOutput {
    binding;
    constructor(binding) {
        this.binding = binding;
    }
    get(ref) {
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
    set(ref, value) {
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
