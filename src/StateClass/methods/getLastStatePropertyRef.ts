/**
 * getLastStatePropertyRef.ts
 *
 * StateClassの内部APIとして、最後にアクセスされたStateプロパティ参照（IStatePropertyRef）を取得する関数です。
 *
 * 主な役割:
 * - handlerのstructuredPathInfoStackおよびlistIndexStackから、直近のパス情報とリストインデックスを取得
 * - それらをIStatePropertyRefとして返却
 * - スタックが空、または値が未定義の場合はnullを返す
 *
 * 設計ポイント:
 * - StateClassのプロパティアクセス時に、現在の参照スコープ情報を安全に取得
 * - バインディングや依存解決など、直近の参照情報が必要な場面で利用
 */
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IStateHandler } from "../types";

export function getLastStatePropertyRef(
  handler: IStateHandler
): IStatePropertyRef | null {
  if (handler.structuredPathInfoStack.length === 0) {
    return null;
  }
  const info = handler.structuredPathInfoStack[handler.structuredPathInfoStack.length - 1];
  if (typeof info === "undefined") {
    return null;
  }
  const listIndex = handler.listIndexStack[handler.listIndexStack.length - 1];
  if (typeof listIndex === "undefined") {
    return null;
  }
  return {info, listIndex};
}
