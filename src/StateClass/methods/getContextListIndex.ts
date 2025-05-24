/**
 * getContextListIndex.ts
 *
 * StateClassの内部APIとして、現在のプロパティ参照スコープにおける
 * 指定したstructuredPath（ワイルドカード付きプロパティパス）に対応する
 * リストインデックス（IListIndex）を取得する関数です。
 *
 * 主な役割:
 * - handlerの最後にアクセスされたStatePropertyRefから、指定パスに対応するリストインデックスを取得
 * - ワイルドカード階層に対応し、多重ループやネストした配列バインディングにも利用可能
 *
 * 設計ポイント:
 * - 直近のプロパティ参照情報を取得
 * - info.wildcardPathsからstructuredPathのインデックスを特定
 * - listIndex.at(index)で該当階層のリストインデックスを取得
 * - パスが一致しない場合や参照が存在しない場合はnullを返す
 */
import { IListIndex } from "../../ListIndex/types";
import { IStateHandler } from "../types";

export function getContextListIndex(
  handler: IStateHandler,
  structuredPath: string
): IListIndex | null {
  const info = handler.structuredPathInfoStack[handler.structuredPathInfoStack.length - 1];
  if (typeof info === "undefined") {
    return null;
  }
  const index = info.indexByWildcardPath[structuredPath];
  if (index >= 0) {
    const listIndex = handler.listIndexStack[handler.listIndexStack.length - 1];
    if (typeof listIndex === "undefined") {
      return null;
    }
    return listIndex?.at(index) ?? null;
  }
  return null;
}
