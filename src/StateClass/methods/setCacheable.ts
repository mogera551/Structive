/**
 * setCacheable.ts
 *
 * StateClassの内部APIとして、キャッシュ可能なスコープを一時的に有効化し、
 * 指定したコールバック処理をキャッシュ付きで実行するための関数です。
 *
 * 主な役割:
 * - handler.cacheableをtrueに設定し、キャッシュ用オブジェクトを初期化
 * - 指定したcallbackをキャッシュ有効状態で実行
 * - finallyで必ずcacheableをfalseに戻し、スコープ外ではキャッシュを無効化
 *
 * 設計ポイント:
 * - コールバック実行中のみキャッシュを有効化し、スコープ外への影響を防止
 * - finallyで状態復元を保証し、例外発生時も安全
 */
import { IReadonlyStateHandler } from "../types";

export function setCacheable(handler: IReadonlyStateHandler, callback: () => void): void {
  handler.cacheable = true;
  handler.cache = {}
  try {
    callback();
  } finally {
    handler.cacheable = false;
  }
}
