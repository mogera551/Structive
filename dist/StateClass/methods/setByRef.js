import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../../utils.js";
import { getByRefWritable } from "./getByRefWritable";
import { setStatePropertyRef } from "./setStatePropertyRef";
export function setByRef(target, ref, value, receiver, handler) {
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.setters.intersection(ref.info.cumulativePathSet).size === 0) {
            return handler.engine.stateOutput.set(ref.info, ref.listIndex, value);
        }
        if (ref.info.pattern in target) {
            return setStatePropertyRef(handler, ref.info, ref.listIndex, () => {
                return Reflect.set(target, ref.info.pattern, value, receiver);
            });
        }
        else {
            const parentInfo = ref.info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < ref.info.wildcardCount ? (ref.listIndex?.parentListIndex ?? null) : ref.listIndex;
            const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
            const parentValue = getByRefWritable(target, parentRef, receiver, handler);
            const lastSegment = ref.info.lastSegment;
            if (lastSegment === "*") {
                const index = ref.listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return Reflect.set(parentValue, index, value);
            }
            else {
                return Reflect.set(parentValue, lastSegment, value);
            }
        }
    }
    finally {
        handler.updater.enqueueRef(ref);
    }
}
