import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
import { GetByRefSymbol, SetCacheableSymbol } from "./symbols";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    updater;
    cache = null;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    #setMethods = new Set([GetByRefSymbol, SetCacheableSymbol]);
    #setApis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine, updater) {
        this.engine = engine;
        this.updater = updater;
    }
    get(target, prop, receiver) {
        return trapGet(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError({
            code: 'STATE-202',
            message: `Cannot set property ${String(prop)} of readonly state`,
            context: { where: 'createReadonlyStateProxy.set', prop: String(prop) },
            docsUrl: './docs/error-codes.md#state',
        });
    }
    has(target, prop) {
        return Reflect.has(target, prop) || this.#setMethods.has(prop) || this.#setApis.has(prop);
    }
}
export function createReadonlyStateHandler(engine, updater) {
    return new StateHandler(engine, updater);
}
export function createReadonlyStateProxy(state, handler) {
    return new Proxy(state, handler);
}
