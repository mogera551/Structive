/**
 * setTracking.ts
 *
 * StateClassの内部APIとして、依存関係トラッキング用のスコープを一時的に設定し、
 * 指定したコールバックをそのスコープ内で実行するための関数です。
 *
 * 主な役割:
 * - handler.trackingStackにinfo（依存対象のパス情報）をpushしてトラッキングスコープを設定
 * - 指定したcallbackをそのスコープ内で実行
 * - finallyで必ずtrackingStackからpopし、スコープ外への影響を防止
 * - lastTrackingStackも適切に更新
 *
 * 設計ポイント:
 * - コールバック実行中のみ依存トラッキングを有効化し、例外発生時も状態復元を保証
 * - ネストした依存トラッキングにも対応可能
 */
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

export function setTracking(info: IStructuredPathInfo, handler: IStateHandler, callback: () => any): any {
  handler.trackingIndex++;
  if (handler.trackingIndex >= handler.trackingStack.length) {
    handler.trackingStack.push(null);
  }
  handler.trackingStack[handler.trackingIndex] = info;
  handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex - 1] ?? null;
  try {
    return callback();
  } finally {
    handler.trackingIndex--;
    handler.trackingStack[handler.trackingIndex + 1] = null;
    handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex - 1] ?? null;
  }
}
