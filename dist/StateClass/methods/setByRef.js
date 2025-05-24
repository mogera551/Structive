import { raiseError } from "../../utils.js";
import { getByRefWritable } from "./getByRefWritable";
import { setStatePropertyRef } from "./setStatePropertyRef";
export function setByRef(target, info, listIndex, value, receiver, handler) {
    try {
        if (info.pattern in target) {
            return setStatePropertyRef(handler, info, listIndex, () => {
                return Reflect.set(target, info.pattern, value, receiver);
            });
        }
        else {
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRefWritable(target, parentInfo, parentListIndex, receiver, handler);
            const lastSegment = info.lastSegment;
            if (lastSegment === "*") {
                const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return Reflect.set(parentValue, index, value);
            }
            else {
                return Reflect.set(parentValue, lastSegment, value);
            }
        }
    }
    finally {
        handler.engine.updater.addUpdatedStatePropertyRefValue(info, listIndex, value);
    }
}
