import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    cache = null;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    renderer = null;
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
    }
    get(target, prop, receiver) {
        return trapGet(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError(`Cannot set property ${String(prop)} of readonly state.`);
    }
}
export function createReadonlyStateProxy(engine, state, renderer = null) {
    return new Proxy(state, new StateHandler(engine, renderer));
}
