/**
 * disconnectedCallback.ts
 *
 * StateClassのライフサイクルフック「$disconnectedCallback」を呼び出すユーティリティ関数です。
 *
 * 主な役割:
 * - オブジェクト（target）に$disconnectedCallbackメソッドが定義されていれば呼び出す
 * - コールバックはtargetのthisコンテキストで呼び出し、IReadonlyStateProxy（receiver）を引数として渡す
 * - 非同期関数として実行可能（await対応）
 *
 * 設計ポイント:
 * - Reflect.getで$disconnectedCallbackプロパティを安全に取得
 * - 存在しない場合は何もしない
 * - ライフサイクル管理やクリーンアップ処理に利用
 */
import { IWritableStateProxy, IWritableStateHandler } from "../types";

const DISCONNECTED_CALLBACK = "$disconnectedCallback";

export async function disconnectedCallback(
  target: Object, 
  prop: PropertyKey, 
  receiver: IWritableStateProxy,
  handler: IWritableStateHandler
):Promise<void> {
  const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
  if (typeof callback === "function") {
    await callback.call(receiver);
  }
}