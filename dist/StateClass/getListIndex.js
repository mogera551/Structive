import { raiseError } from "../utils.js";
export function getListIndex(info, engine) {
    if (info.info.wildcardCount === 0) {
        return null;
    }
    let listIndex = null;
    const lastWildcardPath = info.info.lastWildcardPath ??
        raiseError(`lastWildcardPath is null`);
    if (info.wildcardType === "context") {
        listIndex = engine.getContextListIndex(lastWildcardPath) ??
            raiseError(`ListIndex not found: ${info.info.pattern}`);
    }
    else if (info.wildcardType === "all") {
        let parentListIndex = null;
        for (let i = 0; i < info.info.wildcardCount; i++) {
            const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
            const listIndexes = Array.from(engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
            const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
            parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        listIndex = parentListIndex;
    }
    else if (info.wildcardType === "partial") {
        // ToDo:listIndexを取得する必要がある
    }
    else if (info.wildcardType === "none") {
    }
    return listIndex;
}
