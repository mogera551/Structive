import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { raiseError } from "../utils";
import { AssignStateSymbol, NotifyRedrawSymbol } from "./symbols";
class ComponentStateInputHandler {
    componentStateBinding;
    engine;
    constructor(engine, componentStateBinding) {
        this.componentStateBinding = componentStateBinding;
        this.engine = engine;
    }
    assignState(object) {
        this.engine.useWritableStateProxy(null, async (state) => {
            for (const [key, value] of Object.entries(object)) {
                const childPathInfo = getStructuredPathInfo(key);
                this.engine.setPropertyValue(childPathInfo, null, value);
            }
        });
    }
    /**
     * listindexに一致するかどうかは事前にスクリーニングしておく
     * @param refs
     */
    notifyRedraw(refs) {
        for (const parentPathRef of refs) {
            try {
                const childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathRef.info.pattern);
                const childPathInfo = getStructuredPathInfo(childPath);
                const childListIndex = parentPathRef.listIndex;
                const value = this.engine.getPropertyValue(childPathInfo, childListIndex);
                this.engine.updater.addUpdatedStatePropertyRefValue(childPathInfo, childListIndex, value);
            }
            catch (e) {
                // 対象でないものは何もしない
            }
        }
    }
    get(target, prop, receiver) {
        if (prop === AssignStateSymbol) {
            return this.assignState.bind(this);
        }
        else if (prop === NotifyRedrawSymbol) {
            return this.notifyRedraw.bind(this);
        }
        else if (typeof prop === "string") {
            return this.engine.getPropertyValue(getStructuredPathInfo(prop), null);
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
    set(target, prop, value, receiver) {
        if (typeof prop === "string") {
            this.engine.setPropertyValue(getStructuredPathInfo(prop), null, value);
            return true;
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
}
export function createComponentStateInput(engine, componentStateBinding) {
    const handler = new ComponentStateInputHandler(engine, componentStateBinding);
    return new Proxy({}, handler);
}
