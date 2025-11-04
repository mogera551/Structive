import { set as trapSet } from "./traps/set.js";
import { setLoopContext } from "./methods/setLoopContext";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, GetListIndexesByRefSymbol, SetByRefSymbol } from "./symbols";
import { get as trapGet } from "./traps/get.js";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    updater;
    renderer = null;
    symbols = new Set([GetByRefSymbol, SetByRefSymbol, GetListIndexesByRefSymbol, ConnectedCallbackSymbol, DisconnectedCallbackSymbol]);
    apis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine, updater) {
        this.engine = engine;
        this.updater = updater;
    }
    get(target, prop, receiver) {
        return trapGet(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        return trapSet(target, prop, value, receiver, this);
    }
    has(target, prop) {
        return Reflect.has(target, prop) || this.symbols.has(prop) || this.apis.has(prop);
    }
}
export async function useWritableStateProxy(engine, updater, state, loopContext, callback) {
    const handler = new StateHandler(engine, updater);
    const stateProxy = new Proxy(state, handler);
    return setLoopContext(handler, loopContext, async () => {
        await callback(stateProxy, handler);
    });
}
