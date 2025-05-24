import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { getByRefReadonly } from "../methods/getByRefReadonly";
export function resolveReadonly(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        if (typeof value === "undefined") {
            return getByRefReadonly(target, info, listIndex, receiver, handler);
        }
        else {
            raiseError(`Cannot set value on a readonly proxy: ${path}`);
        }
    };
}
