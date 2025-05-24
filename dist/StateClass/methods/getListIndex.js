import { raiseError } from "../../utils.js";
import { getContextListIndex } from "./getContextListIndex";
export function getListIndex(info, receiver, handler) {
    switch (info.wildcardType) {
        case "none":
            return null;
        case "context":
            const lastWildcardPath = info.info.lastWildcardPath ??
                raiseError(`lastWildcardPath is null`);
            return getContextListIndex(handler, lastWildcardPath) ??
                raiseError(`ListIndex not found: ${info.info.pattern}`);
        case "all":
            let parentListIndex = null;
            for (let i = 0; i < info.info.wildcardCount; i++) {
                const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
                const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
                const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
                parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            }
            return parentListIndex;
        case "partial":
            raiseError(`Partial wildcard type is not supported yet: ${info.info.pattern}`);
    }
}
