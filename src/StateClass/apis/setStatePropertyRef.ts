/**
 * setStatePropertyRef.ts
 *
 * StateClassのAPIとして、Stateプロパティ参照（StatePropertyRef）を設定するための関数（setStatePropertyRef）の実装です。
 *
 * 主な役割:
 * - StateClassのプロキシAPI経由で、指定したパス情報（IStructuredPathInfo）とリストインデックス（IListIndex）に対応する
 *   StatePropertyRefを一時的に設定し、コールバックを実行
 * - 内部的にはmethods/setStatePropertyRefのロジックを呼び出して処理を委譲
 *
 * 設計ポイント:
 * - target, prop, receiver, handlerなどStateClassのプロキシ情報を引数として受け取る
 * - コールバック関数を引数に取り、StatePropertyRefを一時的に切り替えて処理を実行
 * - バインディングやAPI経由での柔軟な利用が可能
 */
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
import { setStatePropertyRef as methodSetStatePropertyRef } from "../methods/setStatePropertyRef";

export function setStatePropertyRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return (info: IStructuredPathInfo, listIndex: IListIndex | null, callback: () => void) => 
    methodSetStatePropertyRef(handler, info, listIndex, callback);
}