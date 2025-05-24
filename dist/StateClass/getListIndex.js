import { raiseError } from "../utils.js";
import { GetContextListIndexSymbol } from "./symbols";
export function getListIndex(info, receiver, handler) {
    if (info.wildcardType === "none") {
        return null;
    }
    else if (info.wildcardType === "context") {
        const lastWildcardPath = info.info.lastWildcardPath ??
            raiseError(`lastWildcardPath is null`);
        return receiver[GetContextListIndexSymbol](lastWildcardPath) ??
            raiseError(`ListIndex not found: ${info.info.pattern}`);
    }
    else if (info.wildcardType === "all") {
        let parentListIndex = null;
        for (let i = 0; i < info.info.wildcardCount; i++) {
            const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
            const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
            const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
            parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        return parentListIndex;
    }
    else if (info.wildcardType === "partial") {
        raiseError(`Partial wildcard type is not supported yet: ${info.info.pattern}`);
    }
    return null;
}
