/**
 * getByRef.ts
 *
 * StateClassのAPIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * Stateの値を取得するための関数（getByRef）の実装です。
 *
 * 主な役割:
 * - getByRefメソッドを通じて、指定されたパス・インデックスに対応するState値を取得
 * - 内部的にはmethods/getByRef.jsのロジックを呼び出し、値の解決を委譲
 *
 * 設計ポイント:
 * - target, receiver, handlerなどStateClassのプロキシ情報を引数として受け取り、柔軟な値取得を実現
 * - pattern（IStructuredPathInfo）とlistIndexで多重ループやネストしたパスにも対応
 * - 関数として返すことで、バインディングやAPI経由での柔軟な利用が可能
 */
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
import { getByRef as methodGetByRef } from "../methods/getByRef.js";

export function getByRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (pattern: IStructuredPathInfo, listIndex: IListIndex | null) => 
    methodGetByRef(target, pattern, listIndex, receiver, handler);
} 
