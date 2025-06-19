import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    cacheable = false;
    cache = new Map();
    lastTrackingStack = null;
    trackingStack = Array(STACK_DEPTH).fill(null);
    trackingIndex = -1;
    structuredPathInfoStack = Array(STACK_DEPTH).fill(null);
    listIndexStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    loopContext = null;
    constructor(engine) {
        this.engine = engine;
    }
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
