import { raiseError } from "../../utils";
export function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? raiseError("Internal error: refStack is null.");
        if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
            lastInfo.pattern !== path) {
            handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, path);
        }
    };
}
