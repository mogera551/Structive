/**
 * setCacheable.ts
 *
 * StateClassのAPIとして、キャッシュ可能な処理を登録するための関数（setCacheable）の実装です。
 *
 * 主な役割:
 * - StateClassのプロキシAPI経由で、キャッシュ可能なコールバック処理を登録
 * - 内部的にはmethods/setCacheable.jsのロジックを呼び出して処理を委譲
 *
 * 設計ポイント:
 * - target, prop, receiver, handlerなどStateClassのプロキシ情報を引数として受け取る
 * - コールバック関数を引数に取り、キャッシュ可能な処理として登録
 * - バインディングやAPI経由での柔軟な利用が可能
 */
import { IStateHandler, IStateProxy } from "../types";
import { setCacheable as methodSetChargeable } from "../methods/setCacheable.js";

export function setCacheable(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (callback: () => void) => {
    methodSetChargeable(handler, callback);
  }
}