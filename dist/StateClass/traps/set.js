import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo";
import { getListIndex } from "../getListIndex";
import { setByRef } from "../methods/setByRef";
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
