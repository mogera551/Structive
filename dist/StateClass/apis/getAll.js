/**
 * getAllWritable
 *
 * ワイルドカードを含む State パスから、対象となる全要素を配列で取得する（Writable版）。
 * Throws: LIST-201（インデックス未解決）、BIND-201（ワイルドカード情報不整合）
 */
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { getContextListIndex } from "../methods/getContextListIndex.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
import { resolve } from "./resolve.js";
export function getAll(target, prop, receiver, handler) {
    const resolveFn = resolve(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.lastRefStack?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
        if (typeof indexes === "undefined") {
            for (let i = 0; i < info.wildcardInfos.length; i++) {
                const wildcardPattern = info.wildcardInfos[i] ?? raiseError({
                    code: 'BIND-201',
                    message: 'wildcardPattern is null',
                    context: { index: i, infoPattern: info.pattern },
                    docsUrl: '/docs/error-codes.md#bind',
                    severity: 'error',
                });
                const listIndex = getContextListIndex(handler, wildcardPattern.pattern);
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
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            const listIndexes = handler.accessor.getListIndexes(wildcardRef) ?? raiseError({
                code: 'LIST-201',
                message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                context: { pattern: wildcardParentPattern.pattern },
                docsUrl: '/docs/error-codes.md#list',
                severity: 'error',
            });
            const index = indexes[indexPos] ?? null;
            if (index === null) {
                for (let i = 0; i < listIndexes.length; i++) {
                    const listIndex = listIndexes[i];
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
            else {
                const listIndex = listIndexes[index] ?? raiseError({
                    code: 'LIST-201',
                    message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                    context: { pattern: wildcardParentPattern.pattern, index },
                    docsUrl: '/docs/error-codes.md#list',
                    severity: 'error',
                });
                if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
                else {
                    // 最終ワイルドカード層まで到達しているので、結果を確定
                    results.push(parentIndexes.concat(listIndex.index));
                }
            }
        };
        const resultIndexes = [];
        walkWildcardPattern(info.wildcardParentInfos, 0, null, indexes, 0, [], resultIndexes);
        const resultValues = [];
        for (let i = 0; i < resultIndexes.length; i++) {
            resultValues.push(resolveFn(info.pattern, resultIndexes[i]));
        }
        return resultValues;
    };
}
