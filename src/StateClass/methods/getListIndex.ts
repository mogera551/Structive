/**
 * getListIndex.ts
 *
 * StateClassの内部APIとして、パス情報（IResolvedPathInfo）から
 * 対応するリストインデックス（IListIndex）を取得する関数です。
 *
 * 主な役割:
 * - パスのワイルドカード種別（context/all/partial/none）に応じてリストインデックスを解決
 * - context型は現在のループコンテキストからリストインデックスを取得
 * - all型は各階層のリストインデックス集合からインデックスを辿って取得
 * - partial型やnone型は未実装またはnullを返す
 *
 * 設計ポイント:
 * - ワイルドカードや多重ループ、ネストした配列バインディングに柔軟に対応
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 * - エラー時はraiseErrorで詳細な例外を投げる
 */
import { IListIndex } from "../../ListIndex/types";
import { IResolvedPathInfo } from "../../StateProperty/types";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../../utils.js";
import { GetListIndexesByRefSymbol } from "../symbols";
import { IStateHandler, IReadonlyStateProxy, IStateProxy } from "../types";
import { getContextListIndex } from "./getContextListIndex";

export function getListIndex(
  resolvedPath: IResolvedPathInfo, 
  receiver: IStateProxy,
  handler: IStateHandler
): IListIndex | null {
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
      let parentListIndex: IListIndex | null = null;
      for(let i = 0; i < resolvedPath.info.wildcardCount; i++) {
        const wildcardParentPattern = resolvedPath.info.wildcardParentInfos[i] ?? 
          raiseError({
            code: 'STATE-202',
            message: 'wildcardParentPattern is null',
            context: { where: 'getListIndex', pattern: resolvedPath.info.pattern, index: i },
            docsUrl: '/docs/error-codes.md#state',
          });
        const wildcardRef = getStatePropertyRef(wildcardParentPattern, parentListIndex);
        const listIndexes: IListIndex[] = receiver[GetListIndexesByRefSymbol](wildcardRef) ?? 
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
