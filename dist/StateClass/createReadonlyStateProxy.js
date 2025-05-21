import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, ResolveSymbol, SetCacheableSymbol } from "./symbols.js";
import { getByRef as apiGetByRef } from "./apis/getByRef.js";
import { setCacheable as apiSetCacheable } from "./apis/setCacheable.js";
import { connectedCallback } from "./apis/connectedCallback.js";
import { disconnectedCallback } from "./apis/disconnectedCallback.js";
import { resolve } from "./apis/resolve.js";
import { getAll } from "./apis/getAll.js";
import { get as trapGet } from "./traps/get.js";
import { raiseError } from "../utils";
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
        [SetCacheableSymbol]: apiSetCacheable,
        [ConnectedCallbackSymbol]: connectedCallback,
        [DisconnectedCallbackSymbol]: disconnectedCallback,
        [ResolveSymbol]: resolve,
        [GetAllSymbol]: getAll,
    };
    get(target, prop, receiver) {
        return trapGet(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError(`Cannot set property ${String(prop)} of readonly state.`);
    }
}
export function createReadonlyStateProxy(engine, state) {
    return new Proxy(state, new StateHandler(engine));
}
