import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
import { GetByRefSymbol, SetCacheableSymbol } from "./symbols";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    cache = null;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    renderer = null;
    #setMethods = new Set([GetByRefSymbol, SetCacheableSymbol]);
    #setApis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
    }
    get(target, prop, receiver) {
        return trapGet(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError({
            code: 'STATE-202',
            message: `Cannot set property ${String(prop)} of readonly state`,
            context: { where: 'createReadonlyStateProxy.set', prop: String(prop) },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    has(target, prop) {
        return Reflect.has(target, prop) || this.#setMethods.has(prop) || this.#setApis.has(prop);
    }
}
export function createReadonlyStateProxy(engine, state, renderer = null) {
    return new Proxy(state, new StateHandler(engine, renderer));
}
