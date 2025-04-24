import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, ResolveSymbol, SetByRefSymbol, SetCacheableSymbol } from "./symbols";
import { getByRef as apiGetByRef } from "./apis/getByRef";
import { setByRef as apiSetByRef } from "./apis/setByRef";
import { setCacheable as apiSetCacheable } from "./apis/setCacheable";
import { connectedCallback } from "./apis/connectedCallback";
import { disconnectedCallback } from "./apis/disconnectedCallback";
import { resolve } from "./apis/resolve";
import { getAll } from "./apis/getAll";
import { get as trapGet } from "./traps/get";
import { set as trapSet } from "./traps/set";
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
        return trapSet(target, prop, value, receiver, this);
    }
}
export function createStateProxy(engine, state) {
    return new Proxy(state, new StateHandler(engine));
}
