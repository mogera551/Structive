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
import { IListIndex } from "../ListIndex/types";
import { IResolvedPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils.js";
import { IStateHandler, IStateProxy } from "./types";
import { getContextListIndex } from "./methods/getContextListIndex";

export function getListIndex(
  info: IResolvedPathInfo, 
  receiver: IStateProxy,
  handler: IStateHandler
): IListIndex | null {
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
      for(let i = 0; i < info.info.wildcardCount; i++) {
        const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
        const listIndexes: IListIndex[] = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
        const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
        parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
      }
      return parentListIndex;
    case "partial":
      raiseError(`Partial wildcard type is not supported yet: ${info.info.pattern}`);
  }
}
