/**
 * setStatePropertyRef.ts
 *
 * StateClassの内部APIとして、状態プロパティ参照（IStructuredPathInfo, IListIndex）のスコープを
 * 一時的に設定し、指定したコールバックをそのスコープ内で実行するための関数です。
 *
 * 主な役割:
 * - handler.structuredPathInfoStackとhandler.listIndexStackにinfoとlistIndexをpushしてスコープを設定
 * - 指定したcallbackをそのスコープ内で実行
 * - finallyで必ずスタックからpopし、スコープ外への影響を防止
 *
 * 設計ポイント:
 * - コールバック実行中のみスコープを切り替え、例外発生時も状態復元を保証
 * - ネストしたスコープにも対応可能
 */
import { IListIndex2 } from "../../ListIndex2/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

export function setStatePropertyRef(
  handler: IStateHandler,
  info: IStructuredPathInfo,
  listIndex: IListIndex2 | null,
  callback: () => void
): void {
  handler.refIndex++;
  if (handler.refIndex >= handler.structuredPathInfoStack.length) {
    handler.structuredPathInfoStack.push(null);
    handler.listIndex2Stack.push(null);
  }
  handler.structuredPathInfoStack[handler.refIndex] = info;
  handler.listIndex2Stack[handler.refIndex] = listIndex;
  try {
    return callback();
  } finally {
    handler.structuredPathInfoStack[handler.refIndex] = null;
    handler.listIndex2Stack[handler.refIndex] = null;
    handler.refIndex--;
  }
}
