/**
 * setByRef.ts
 *
 * StateClassのAPIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * Stateの値を設定するための関数（setByRef）の実装です。
 *
 * 主な役割:
 * - setByRefメソッドを通じて、指定されたパス・インデックスに対応するState値を設定
 * - 内部的にはmethods/setByRef.jsのロジックを呼び出し、値の設定処理を委譲
 *
 * 設計ポイント:
 * - target, receiver, handlerなどStateClassのプロキシ情報を引数として受け取り、柔軟な値設定を実現
 * - pattern（IStructuredPathInfo）とlistIndexで多重ループやネストしたパスにも対応
 * - 関数として返すことで、バインディングやAPI経由での柔軟な利用が可能
 */
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IReadonlyStateProxy } from "../types";
import { setByRef as methodSetByRef } from "../methods/setByRef.js";

export function setByRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IReadonlyStateProxy,
  handler: IStateHandler
):Function {
  return (pattern: IStructuredPathInfo, listIndex: IListIndex | null, value: any) => 
    methodSetByRef(target, pattern, listIndex, value, receiver, handler);
}