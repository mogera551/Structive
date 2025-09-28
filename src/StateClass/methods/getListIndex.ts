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
        raiseError(`lastWildcardPath is null`);
      return getContextListIndex(handler, lastWildcardPath) ?? 
        raiseError(`ListIndex not found: ${resolvedPath.info.pattern}`);
    case "all":
      let parentListIndex: IListIndex | null = null;
      for(let i = 0; i < resolvedPath.info.wildcardCount; i++) {
        const wildcardParentPattern = resolvedPath.info.wildcardParentInfos[i] ?? 
          raiseError(`wildcardParentPattern is null`);
        const wildcardRef = getStatePropertyRef(wildcardParentPattern, parentListIndex);
        const listIndexes: IListIndex[] = handler.engine.getListIndexes(wildcardRef) ?? 
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
