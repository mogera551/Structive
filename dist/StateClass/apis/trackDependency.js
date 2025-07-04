import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
export function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
    };
}
