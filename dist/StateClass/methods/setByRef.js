import { raiseError } from "../../utils.js";
import { setStatePropertyRef } from "./setStatePropertyRef";
export function setByRef(target, ref, value, receiver, handler) {
    // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.setters.intersection(ref.info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.set(ref, value);
    }
    if (ref.info.pattern in target) {
        return setStatePropertyRef(handler, ref, () => {
            return Reflect.set(target, ref.info.pattern, value, receiver);
        });
    }
    else {
        const parentRef = ref.getParentRef() ?? raiseError({
            code: 'STATE-202',
            message: 'propRef.getParentRef() returned null',
            context: { where: 'setByRef', refPath: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
        const parentValue = handler.accessor.getValue(parentRef);
        const lastSegment = ref.info.lastSegment;
        if (lastSegment === "*") {
            const index = ref.listIndex?.index ?? raiseError({
                code: 'STATE-202',
                message: 'propRef.listIndex?.index is undefined',
                context: { where: 'setByRef', refPath: ref.info.pattern },
                docsUrl: '/docs/error-codes.md#state',
            });
            return Reflect.set(parentValue, index, value);
        }
        else {
            return Reflect.set(parentValue, lastSegment, value);
        }
    }
}
