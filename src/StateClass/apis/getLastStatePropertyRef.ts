/**
 * getLastStatePropertyRef.ts
 *
 * StateClassのAPIとして、最後にアクセスされたStateプロパティ参照（StatePropertyRef）を取得する関数の実装です。
 *
 * 主な役割:
 * - StateClassのプロキシAPI経由で、最後にアクセスされたStatePropertyRefを取得
 * - 内部的にはmethods/getLastStatePropertyRef.jsのロジックを呼び出して値を解決
 *
 * 設計ポイント:
 * - target, prop, receiver, handlerなどStateClassのプロキシ情報を引数として受け取る
 * - 関数として返すことで、バインディングやAPI経由での柔軟な利用が可能
 */
import { IStateHandler, IStateProxy } from "../types";
import { getLastStatePropertyRef as methodGetLastStatePropertyRef } from "../methods/getLastStatePropertyRef.js";

export function getLastStatePropertyRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return () => 
    methodGetLastStatePropertyRef(handler);
}