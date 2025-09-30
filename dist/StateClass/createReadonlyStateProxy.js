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
        raiseError({
            code: 'STATE-202',
            message: `Cannot set property ${String(prop)} of readonly state`,
            context: { where: 'createReadonlyStateProxy.set', prop: String(prop) },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
}
export function createReadonlyStateProxy(engine, state, renderer = null) {
    return new Proxy(state, new StateHandler(engine, renderer));
}
