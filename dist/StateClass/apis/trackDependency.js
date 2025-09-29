import { raiseError } from "../../utils";
export function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const lastInfo = handler.lastRefStack?.info ?? raiseError("Internal error: lastRefStack is null.");
        if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
            lastInfo.pattern !== path) {
            handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, path);
        }
    };
}
