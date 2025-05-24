import { getWritable as trapGet } from "./traps/getWritable.js";
import { set as trapSet } from "./traps/set.js";
import { setLoopContext } from "./methods/setLoopContext";
class StateHandler {
    engine;
    lastTrackingStack = null;
    secondToLastTrackingStack = null;
    trackingStack = [];
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
