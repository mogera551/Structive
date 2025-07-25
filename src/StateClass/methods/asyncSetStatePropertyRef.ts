/**
 * asyncSetStatePropertyRef.ts
 *
 * 状態プロパティ参照のスコープを一時的に設定し、非同期コールバックを実行するユーティリティ関数です。
 *
 * 主な役割:
 * - handlerのstructuredPathInfoStackとlistIndexStackに、infoとlistIndexをpushしてスコープを設定
 * - 指定した非同期コールバック（callback）をそのスコープ内で実行
 * - callback実行後は必ずpopしてスコープを元に戻す（finallyで保証）
 *
 * 設計ポイント:
 * - 非同期処理中も正しいスコープ情報（パス・リストインデックス）が維持される
 * - ネストした非同期処理にも対応可能
 * - スコープのpush/popは例外発生時も確実に実行される
 */
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

/**
 * 状態プロパティ参照のスコープを一時的に設定し、非同期コールバックを実行します。
 * 
 * @param handler   スコープ管理用のハンドラ
 * @param info      現在の構造化パス情報
 * @param listIndex 現在のリストインデックス（ネスト対応用）
 * @param callback  スコープ内で実行する非同期処理
 * 
 * スタックに info と listIndex をpushし、callback実行後に必ずpopします。
 * これにより、非同期処理中も正しいスコープ情報が維持されます。
 */
export async function asyncSetStatePropertyRef(
  handler: IStateHandler,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  callback: () => Promise<void>
): Promise<void> {
  handler.refIndex++;
  if (handler.refIndex >= handler.structuredPathInfoStack.length) {
    handler.structuredPathInfoStack.push(null);
    handler.listIndexStack.push(null);
  }
  handler.structuredPathInfoStack[handler.refIndex] = info;
  handler.listIndexStack[handler.refIndex] = listIndex;
  try {
    await callback();
  } finally {
    handler.structuredPathInfoStack[handler.refIndex] = null;
    handler.listIndexStack[handler.refIndex] = null;
    handler.refIndex--;
  }
}
