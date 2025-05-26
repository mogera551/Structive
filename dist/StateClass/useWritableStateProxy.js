import { getWritable as trapGet } from "./traps/getWritable.js";
import { set as trapSet } from "./traps/set.js";
import { setLoopContext } from "./methods/setLoopContext";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
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
        return trapSet(target, prop, value, receiver, this);
    }
}
export async function useWritableStateProxy(engine, state, loopContext = null, callback) {
    const handler = new StateHandler(engine);
    const stateProxy = new Proxy(state, handler);
    return setLoopContext(handler, loopContext, async () => {
        await callback(stateProxy);
    });
}
