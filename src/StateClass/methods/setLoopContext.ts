/**
 * setLoopContext.ts
 *
 * StateClassの内部APIとして、ループコンテキスト（ILoopContext）を一時的に設定し、
 * 指定した非同期コールバックをそのスコープ内で実行するための関数です。
 *
 * 主な役割:
 * - handler.loopContextにループコンテキストを一時的に設定
 * - 既にループコンテキストが設定されている場合はエラーを投げる
 * - loopContextが存在する場合はasyncSetStatePropertyRefでスコープを設定しコールバックを実行
 * - loopContextがnullの場合はそのままコールバックを実行
 * - finallyで必ずloopContextをnullに戻し、スコープ外への影響を防止
 *
 * 設計ポイント:
 * - ループバインディングや多重ループ時のスコープ管理を安全に行う
 * - finallyで状態復元を保証し、例外発生時も安全
 * - 非同期処理にも対応
 */
import { ILoopContext } from "../../LoopContext/types";
import { raiseError } from "../../utils";
import { IWritableStateHandler } from "../types";

export async function setLoopContext(
  handler: IWritableStateHandler,
  loopContext: ILoopContext | null,
  callback: () => Promise<void>
): Promise<void> {
  if (handler.loopContext) {
    raiseError({
      code: 'STATE-301',
      message: 'already in loop context',
      context: { where: 'setLoopContext' },
      docsUrl: '/docs/error-codes.md#state',
    });
  }
  handler.loopContext = loopContext;
  try {
    if (loopContext) {
      if (handler.refStack.length === 0) {
        raiseError({
          code: 'STC-002',
          message: 'handler.refStack is empty in getByRef',
        });
      }
      handler.refIndex++;
      if (handler.refIndex >= handler.refStack.length) {
        handler.refStack.push(null);
      }
      handler.refStack[handler.refIndex] = handler.lastRefStack = loopContext.ref;
      try {
        await callback();
      } finally {
        handler.refStack[handler.refIndex] = null;
        handler.refIndex--;
        handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
      }
    } else {
      await callback();
    }
  } finally {
    handler.loopContext = null;
  }
}
