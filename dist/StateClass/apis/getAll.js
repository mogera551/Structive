import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { GetContextListIndexSymbol } from "../symbols";
import { resolve as _resolve } from "./resolve.js";
export function getAll(target, prop, receiver, handler) {
    const resolve = _resolve(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
            const lastPattern = handler.lastTrackingStack;
            if (lastPattern.parentInfo !== info) {
                handler.engine.addDependentProp(lastPattern, info, "reference");
            }
        }
        if (typeof indexes === "undefined") {
            for (let i = 0; i < info.wildcardInfos.length; i++) {
                const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
                const listIndex = handler.callableApi[GetContextListIndexSymbol](wildcardPattern.pattern);
                if (listIndex) {
                    indexes = listIndex.indexes;
                    break;
                }
            }
            if (typeof indexes === "undefined") {
                indexes = [];
            }
        }
        const walkWildcardPattern = (wildcardParentInfos, wildardIndexPos, listIndex, indexes, indexPos, parentIndexes, results) => {
            const wildcardParentPattern = wildcardParentInfos[wildardIndexPos] ?? null;
            if (wildcardParentPattern === null) {
                results.push(parentIndexes);
                return;
            }
            const listIndexSet = handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            const listIndexes = Array.from(listIndexSet);
            const index = indexes[indexPos] ?? null;
            if (index === null) {
                for (let i = 0; i < listIndexes.length; i++) {
                    const listIndex = listIndexes[i];
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
            else {
                const listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
                if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
        };
        const resultIndexes = [];
        walkWildcardPattern(info.wildcardParentInfos, 0, null, indexes, 0, [], resultIndexes);
        const resultValues = [];
        for (let i = 0; i < resultIndexes.length; i++) {
            resultValues.push(resolve(info.pattern, resultIndexes[i]));
        }
        return resultValues;
    };
}
