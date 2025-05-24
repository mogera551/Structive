import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
class StateHandler {
    engine;
    cacheable = false;
    cache = {};
    lastTrackingStack = null;
    trackingStack = Array(16).fill(null);
    trackingIndex = -1;
    structuredPathInfoStack = [];
    listIndexStack = [];
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
