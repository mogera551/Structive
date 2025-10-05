/**
 * registerStateClass.ts
 *
 * StateClassコンストラクタをIDで登録・取得するための管理モジュールです。
 *
 * 主な役割:
 * - stateClassById: IDをキーにStateClassコンストラクタを管理するレコード
 * - registerStateClass: 指定IDでStateClassコンストラクタを登録
 * - getStateClassById: 指定IDのStateClassコンストラクタを取得（未登録時はエラーを投げる）
 *
 * 設計ポイント:
 * - グローバルにStateClassコンストラクタを一元管理し、ID経由で高速にアクセス可能
 * - 存在しないIDアクセス時はraiseErrorで明確な例外を発生
 */
import { raiseError } from "../utils.js";
import { IStructiveState } from "./types";

const stateClassById: Record<number,IStructiveState> = {};

export function registerStateClass(id: number, stateClass: IStructiveState) {
  stateClassById[id] = stateClass;
}

export function getStateClassById(id: number): IStructiveState {
  return stateClassById[id] ?? raiseError({
    code: "STATE-101",
    message: `StateClass not found: ${id}`,
    context: { where: 'registerStateClass.getStateClassById', stateClassId: id },
    docsUrl: "./docs/error-codes.md#state",
  });
}
