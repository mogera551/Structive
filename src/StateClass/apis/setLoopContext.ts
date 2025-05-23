/**
 * setLoopContext.ts
 *
 * StateClassのAPIとして、ループコンテキスト（for等のループ状態）を設定するための関数（setLoopContext）の実装です。
 *
 * 主な役割:
 * - StateClassのプロキシAPI経由で、ループコンテキスト（ILoopContext）を一時的に設定し、コールバックを実行
 * - 内部的にはmethods/setLoopContext.jsのロジックを呼び出して処理を委譲
 *
 * 設計ポイント:
 * - target, prop, receiver, handlerなどStateClassのプロキシ情報を引数として受け取る
 * - コールバック関数を引数に取り、ループコンテキストを一時的に切り替えて非同期処理を実行
 * - バインディングやAPI経由での柔軟な利用が可能
 */
import { ILoopContext } from "../../LoopContext/types";
import { IStateHandler, IStateProxy } from "../types";
import { setLoopContext as methodSetLoopContext } from "../methods/setLoopContext.js";

export function setLoopContext(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return (loopContext: ILoopContext | null, callback: () => Promise<void>) => 
    methodSetLoopContext(handler, loopContext, callback);
}