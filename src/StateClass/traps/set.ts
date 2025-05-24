/**
 * set.ts
 *
 * StateClassのProxyトラップとして、プロパティ設定時の値セット処理を担う関数（set）の実装です。
 *
 * 主な役割:
 * - 文字列プロパティの場合、getResolvedPathInfoでパス情報を解決し、getListIndexでリストインデックスを取得
 * - setByRefで構造化パス・リストインデックスに対応した値設定を実行
 * - それ以外（シンボル等）の場合はReflect.setで通常のプロパティ設定を実行
 *
 * 設計ポイント:
 * - バインディングや多重ループ、ワイルドカードを含むパスにも柔軟に対応
 * - setByRefを利用することで、依存解決や再描画などの副作用も一元管理
 * - Reflect.setで標準的なプロパティ設定の互換性も確保
 */
import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { getListIndex } from "../methods/getListIndex.js";
import { setByRef } from "../methods/setByRef.js";
import { IStateHandler, IReadonlyStateProxy } from "../types";

export function set(
  target  : Object, 
  prop    : PropertyKey, 
  value   : any, 
  receiver: IReadonlyStateProxy,
  handler : IStateHandler
): boolean {
  if (typeof prop === "string") {
    const resolvedInfo = getResolvedPathInfo(prop);
    const listIndex = getListIndex(resolvedInfo, receiver, handler);
    return setByRef(
      target, 
      resolvedInfo.info, 
      listIndex, 
      value, 
      receiver,
      handler
    );
  } else {
    return Reflect.set(
      target, 
      prop, 
      value, 
      receiver
    );
  }
}
