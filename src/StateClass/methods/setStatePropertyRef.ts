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
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IStateHandler } from "../types";

export function setStatePropertyRef(
  handler: IStateHandler,
  ref: IStatePropertyRef,
  callback: () => void
): void {
  handler.refIndex++;
  if (handler.refIndex >= handler.refStack.length) {
    handler.refStack.push(null);
  }
  handler.refStack[handler.refIndex] = ref;
  try {
    return callback();
  } finally {
    handler.refStack[handler.refIndex] = null;
    handler.refIndex--;
  }
}
