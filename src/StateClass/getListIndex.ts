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
import { GetContextListIndexSymbol } from "./symbols";
import { IStateHandler, IStateProxy } from "./types";

export function getListIndex(
  info: IResolvedPathInfo, 
  receiver: IStateProxy,
  handler: IStateHandler
): IListIndex | null {
  if (info.info.wildcardCount === 0) {
    return null;
  }
  let listIndex: IListIndex | null = null;
  const lastWildcardPath = info.info.lastWildcardPath ?? 
    raiseError(`lastWildcardPath is null`);
  if (info.wildcardType === "context") {
    listIndex = receiver[GetContextListIndexSymbol](lastWildcardPath) ?? 
      raiseError(`ListIndex not found: ${info.info.pattern}`);
  } else if (info.wildcardType === "all") {
    let parentListIndex = null;
    for(let i = 0; i < info.info.wildcardCount; i++) {
      const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
      const listIndexes: IListIndex[] = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
      const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
      parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
    }
    listIndex = parentListIndex;
  } else if (info.wildcardType === "partial") {
    // ToDo:listIndexを取得する必要がある
  } else if (info.wildcardType === "none") {
  }
  return listIndex;
}
