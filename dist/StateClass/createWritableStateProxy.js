import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, GetContextListIndexSymbol, GetLastStatePropertyRefSymbol, ResolveSymbol, SetByRefSymbol, SetLoopContextSymbol, SetStatePropertyRefSymbol } from "./symbols.js";
import { getByRef as apiGetByRef } from "./apis/getByRef.js";
import { setByRef as apiSetByRef } from "./apis/setByRef.js";
import { connectedCallback } from "./apis/connectedCallback.js";
import { disconnectedCallback } from "./apis/disconnectedCallback.js";
import { resolve } from "./apis/resolve.js";
import { getAll } from "./apis/getAll.js";
import { get as trapGet } from "./traps/get.js";
import { set as trapSet } from "./traps/set.js";
import { setStatePropertyRef } from "./apis/setStatePropertyRef";
import { setLoopContext } from "./apis/setLoopContext";
import { getLastStatePropertyRef } from "./apis/getLastStatePropertyRef";
import { getContextListIndex } from "./apis/getContextListIndex";
class StateHandler {
    engine;
    cacheable = false;
    cache = {};
    lastTrackingStack = null;
    trackingStack = [];
    structuredPathInfoStack = [];
    listIndexStack = [];
    loopContext = null;
    constructor(engine) {
        this.engine = engine;
    }
    callableApi = {
        [GetByRefSymbol]: apiGetByRef,
        [SetByRefSymbol]: apiSetByRef,
        [ConnectedCallbackSymbol]: connectedCallback,
        [DisconnectedCallbackSymbol]: disconnectedCallback,
        [ResolveSymbol]: resolve,
        [GetAllSymbol]: getAll,
        [SetStatePropertyRefSymbol]: setStatePropertyRef,
        [SetLoopContextSymbol]: setLoopContext,
        [GetLastStatePropertyRefSymbol]: getLastStatePropertyRef,
        [GetContextListIndexSymbol]: getContextListIndex
    };
    get(target, prop, receiver) {
        return trapGet(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        return trapSet(target, prop, value, receiver, this);
    }
}
export function createWritableStateProxy(engine, state) {
    return new Proxy(state, new StateHandler(engine));
}
