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
  // 依存関係の自動登録
  const lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
  if (lastTrackingStack != null) {
    // gettersに含まれる場合はsetTrackingで依存追跡を有効化
    if (handler.engine.pathManager.getters.has(lastTrackingStack.pattern)) {
      handler.engine.addDependentProp(lastTrackingStack, info, "reference");
    }
  }
  handler.trackingIndex++;
  if (handler.trackingIndex >= handler.trackingStack.length) {
    handler.trackingStack.push(null);
  }
  handler.trackingStack[handler.trackingIndex] = info;
  handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
  try {
    return callback();
  } finally {
    handler.trackingStack[handler.trackingIndex] = null;
    handler.trackingIndex--;
    handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
  }
}
