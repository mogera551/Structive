import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, ResolveSymbol, SetCacheableSymbol } from "./symbols.js";
import { getByRef as apiGetByRef } from "./apis/getByRef.js";
import { setCacheable as apiSetCacheable } from "./apis/setCacheable.js";
import { connectedCallback } from "./apis/connectedCallback.js";
import { disconnectedCallback } from "./apis/disconnectedCallback.js";
import { resolve } from "./apis/resolve.js";
import { getAll } from "./apis/getAll.js";
import { get as trapGet } from "./traps/get.js";
import { raiseError } from "../utils";
class ReadonlyStateHandler {
    engine;
    cacheable = true;
    cache = {};
    lastTrackingStack = null;
    trackingStack = [];
    constructor(engine) {
        this.engine = engine;
    }
    callableApi = {
        [GetByRefSymbol]: apiGetByRef,
        //    [SetByRefSymbol]: apiSetByRef, 
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
        raiseError('readonly state proxy');
    }
}
export function createReadonlyStateProxy(engine, state) {
    return new Proxy(state, new ReadonlyStateHandler(engine));
}
