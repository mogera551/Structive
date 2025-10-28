import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { createUpdater } from "../Updater/Updater";
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
        createUpdater(this.engine, (updater) => {
            updater.update(null, (stateProxy, handler) => {
                for (const [key, value] of Object.entries(object)) {
                    const childPathInfo = getStructuredPathInfo(key);
                    const childRef = getStatePropertyRef(childPathInfo, null);
                    stateProxy[SetByRefSymbol](childRef, value);
                }
            });
        });
    }
    /**
     * listindexに一致するかどうかは事前にスクリーニングしておく
     * @param refs
     */
    notifyRedraw(refs) {
        // ToDo: createUpdater内でループさせるべきか検討
        for (const parentPathRef of refs) {
            try {
                const childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathRef.info.pattern);
                const childPathInfo = getStructuredPathInfo(childPath);
                const childListIndex = parentPathRef.listIndex;
                const childRef = getStatePropertyRef(childPathInfo, childListIndex);
                const value = this.engine.getPropertyValue(childRef);
                // Ref情報をもとに状態更新キューに追加
                createUpdater(this.engine, (updater) => {
                    updater.update(null, (stateProxy, handler) => {
                        stateProxy[SetByRefSymbol](childRef, value);
                    });
                });
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
            const ref = getStatePropertyRef(getStructuredPathInfo(prop), null);
            return this.engine.getPropertyValue(ref);
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
    set(target, prop, value, receiver) {
        if (typeof prop === "string") {
            const ref = getStatePropertyRef(getStructuredPathInfo(prop), null);
            this.engine.setPropertyValue(ref, value);
            return true;
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
}
export function createComponentStateInput(engine, componentStateBinding) {
    const handler = new ComponentStateInputHandler(engine, componentStateBinding);
    return new Proxy({}, handler);
}
