import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../../utils.js";
import { getByRefWritable } from "./getByRefWritable";
import { setStatePropertyRef } from "./setStatePropertyRef";
export function setByRef(target, info, listIndex, value, receiver, handler) {
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(info) && handler.engine.pathManager.setters.intersection(info.cumulativePathSet).size === 0) {
            return handler.engine.stateOutput.set(info, listIndex, value);
        }
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
        const ref = getStatePropertyRef(info, listIndex);
        handler.updater.enqueueRef(ref);
    }
}
