import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../../utils.js";
import { GetListIndexesByRefSymbol } from "../symbols";
import { getContextListIndex } from "./getContextListIndex";
export function getListIndex(resolvedPath, receiver, handler) {
    switch (resolvedPath.wildcardType) {
        case "none":
            return null;
        case "context":
            const lastWildcardPath = resolvedPath.info.lastWildcardPath ??
                raiseError({
                    code: 'STATE-202',
                    message: 'lastWildcardPath is null',
                    context: { where: 'getListIndex', pattern: resolvedPath.info.pattern },
                    docsUrl: '/docs/error-codes.md#state',
                });
            return getContextListIndex(handler, lastWildcardPath) ??
                raiseError({
                    code: 'LIST-201',
                    message: `ListIndex not found: ${resolvedPath.info.pattern}`,
                    context: { where: 'getListIndex', pattern: resolvedPath.info.pattern },
                    docsUrl: '/docs/error-codes.md#list',
                });
        case "all":
            let parentListIndex = null;
            for (let i = 0; i < resolvedPath.info.wildcardCount; i++) {
                const wildcardParentPattern = resolvedPath.info.wildcardParentInfos[i] ??
                    raiseError({
                        code: 'STATE-202',
                        message: 'wildcardParentPattern is null',
                        context: { where: 'getListIndex', pattern: resolvedPath.info.pattern, index: i },
                        docsUrl: '/docs/error-codes.md#state',
                    });
                const wildcardRef = getStatePropertyRef(wildcardParentPattern, parentListIndex);
                const listIndexes = receiver[GetListIndexesByRefSymbol](wildcardRef) ??
                    raiseError({
                        code: 'LIST-201',
                        message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                        context: { where: 'getListIndex', wildcardParent: wildcardParentPattern.pattern },
                        docsUrl: '/docs/error-codes.md#list',
                    });
                const wildcardIndex = resolvedPath.wildcardIndexes[i] ??
                    raiseError({
                        code: 'STATE-202',
                        message: 'wildcardIndex is null',
                        context: { where: 'getListIndex', pattern: resolvedPath.info.pattern, index: i },
                        docsUrl: '/docs/error-codes.md#state',
                    });
                parentListIndex = listIndexes[wildcardIndex] ??
                    raiseError({
                        code: 'LIST-201',
                        message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                        context: { where: 'getListIndex', wildcardParent: wildcardParentPattern.pattern, wildcardIndex },
                        docsUrl: '/docs/error-codes.md#list',
                    });
            }
            return parentListIndex;
        case "partial":
            raiseError({
                code: 'STATE-202',
                message: `Partial wildcard type is not supported yet: ${resolvedPath.info.pattern}`,
                context: { where: 'getListIndex', pattern: resolvedPath.info.pattern },
                docsUrl: '/docs/error-codes.md#state',
            });
    }
}
