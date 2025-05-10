import { createRefKey } from "../../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../../utils";
import { setTracking } from "./setTracking.js";
function _getByRef(target, info, listIndex, receiver, handler) {
    if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
        const lastPattern = handler.lastTrackingStack;
        if (lastPattern.parentInfo !== info) {
            handler.engine.addDependentProp(lastPattern, info);
        }
    }
    let refKey = '';
    if (handler.cacheable) {
        refKey = createRefKey(info, listIndex);
        const value = handler.cache[refKey];
        if (typeof value !== "undefined") {
            return value;
        }
        if (refKey in handler.cache) {
            return undefined;
        }
    }
    let value;
    try {
        if (info.pattern in target) {
            return (value = handler.engine.setStatePropertyRef(info, listIndex, () => {
                return Reflect.get(target, info.pattern, receiver);
            }));
        }
        else {
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRef(target, parentInfo, parentListIndex, receiver, handler);
            const lastSegment = info.lastSegment;
            if (lastSegment === "*") {
                const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return (value = Reflect.get(parentValue, index));
            }
            else {
                return (value = Reflect.get(parentValue, lastSegment));
            }
        }
    }
    finally {
        if (handler.cacheable && !(refKey in handler.cache)) {
            handler.cache[refKey] = value;
        }
    }
}
export function getByRef(target, info, listIndex, receiver, handler) {
    if (handler.engine.trackedGetters.has(info.pattern)) {
        return setTracking(info, handler, () => {
            return _getByRef(target, info, listIndex, receiver, handler);
        });
    }
    else {
        return _getByRef(target, info, listIndex, receiver, handler);
    }
}
