import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { getListIndex } from "../getListIndex.js";
import { setByRef } from "../methods/setByRef.js";
export function set(target, prop, value, receiver, handler) {
    if (typeof prop === "string") {
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, handler.engine);
        return setByRef(target, resolvedInfo.info, listIndex, value, receiver, handler);
    }
    else {
        return Reflect.set(target, prop, value, receiver);
    }
}
