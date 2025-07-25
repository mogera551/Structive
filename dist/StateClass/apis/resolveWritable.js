import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { setByRef } from "../methods/setByRef.js";
import { getByRefWritable } from "../methods/getByRefWritable";
export function resolveWritable(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        if (typeof value === "undefined") {
            return getByRefWritable(target, info, listIndex, receiver, handler);
        }
        else {
            return setByRef(target, info, listIndex, value, receiver, handler);
        }
    };
}
