import { raiseError } from "../utils";
import { GetByRefSymbol, GetListIndexesByRefSymbol } from "./symbols";
import { get as trapGet } from "./traps/get.js";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    updater;
    renderer;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    symbols = new Set([GetByRefSymbol, GetListIndexesByRefSymbol]);
    apis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine, updater, renderer) {
        this.engine = engine;
        this.updater = updater;
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
            docsUrl: './docs/error-codes.md#state',
        });
    }
    has(target, prop) {
        return Reflect.has(target, prop) || this.symbols.has(prop) || this.apis.has(prop);
    }
}
export function createReadonlyStateHandler(engine, updater, renderer) {
    return new StateHandler(engine, updater, renderer);
}
export function createReadonlyStateProxy(state, handler) {
    return new Proxy(state, handler);
}
