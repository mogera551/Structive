import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../../utils.js";
import { getContextListIndex } from "./getContextListIndex";
export function getListIndex(resolvedPath, receiver, handler) {
    switch (resolvedPath.wildcardType) {
        case "none":
            return null;
        case "context":
            const lastWildcardPath = resolvedPath.info.lastWildcardPath ??
                raiseError(`lastWildcardPath is null`);
            return getContextListIndex(handler, lastWildcardPath) ??
                raiseError(`ListIndex not found: ${resolvedPath.info.pattern}`);
        case "all":
            let parentListIndex = null;
            for (let i = 0; i < resolvedPath.info.wildcardCount; i++) {
                const wildcardParentPattern = resolvedPath.info.wildcardParentInfos[i] ??
                    raiseError(`wildcardParentPattern is null`);
                const wildcardRef = getStatePropertyRef(wildcardParentPattern, parentListIndex);
                const listIndexes = handler.engine.getListIndexes(wildcardRef) ??
                    raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
                const wildcardIndex = resolvedPath.wildcardIndexes[i] ??
                    raiseError(`wildcardIndex is null`);
                parentListIndex = listIndexes[wildcardIndex] ??
                    raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            }
            return parentListIndex;
        case "partial":
            raiseError(`Partial wildcard type is not supported yet: ${resolvedPath.info.pattern}`);
    }
}
