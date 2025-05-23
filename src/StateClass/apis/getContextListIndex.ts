/**
 * getContextListIndex.ts
 *
 * StateClassのAPIとして、現在のループコンテキストに対応するリストインデックスを取得する関数（getContextListIndex）の実装です。
 *
 * 主な役割:
 * - StateClassのプロキシAPI経由で、指定したstructuredPath（プロパティパス）に対応するリストインデックスを取得
 * - 内部的にはmethods/getContextListIndexのロジックを呼び出して値を解決
 *
 * 設計ポイント:
 * - target, prop, receiver, handlerなどStateClassのプロキシ情報を引数として受け取る
 * - structuredPathを指定することで、多重ループやネストした配列バインディングにも対応
 * - 関数として返すことで、バインディングやAPI経由での柔軟な利用が可能
 */
import { IStateHandler, IStateProxy } from "../types";
import { getContextListIndex as methodGetContextListIndex } from "../methods/getContextListIndex";

export function getContextListIndex(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return (structuredPath: string) => 
    methodGetContextListIndex(handler, structuredPath);
}