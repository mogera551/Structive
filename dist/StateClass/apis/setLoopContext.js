import { setLoopContext as methodSetLoopContext } from "../methods/setLoopContext.js";
export function setLoopContext(target, prop, receiver, handler) {
    return (loopContext, callback) => methodSetLoopContext(handler, loopContext, callback);
}
