import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, ResolveSymbol, SetByRefSymbol } from "./symbols.js";
import { getByRef as apiGetByRef } from "./apis/getByRef.js";
import { setByRef as apiSetByRef } from "./apis/setByRef.js";
import { connectedCallback } from "./apis/connectedCallback.js";
import { disconnectedCallback } from "./apis/disconnectedCallback.js";
import { resolve } from "./apis/resolve.js";
import { getAll } from "./apis/getAll.js";
import { get as trapGet } from "./traps/get.js";
import { set as trapSet } from "./traps/set.js";
class StateHandler {
    engine;
    cacheable = false;
    cache = {};
    lastTrackingStack = null;
    trackingStack = [];
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
