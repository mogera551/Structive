/**
 * setByRef.ts
 *
 * StateClassの内部APIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * 状態オブジェクト（target）に値を設定するための関数（setByRef）の実装です。
 *
 * 主な役割:
 * - 指定されたパス・インデックスに対応するState値を設定（多重ループやワイルドカードにも対応）
 * - getter/setter経由で値設定時はSetStatePropertyRefSymbolでスコープを一時設定
 * - 存在しない場合は親infoやlistIndexを辿って再帰的に値を設定
 * - 設定後はengine.updater.addUpdatedStatePropertyRefValueで更新情報を登録
 *
 * 設計ポイント:
 * - ワイルドカードや多重ループにも柔軟に対応し、再帰的な値設定を実現
 * - finallyで必ず更新情報を登録し、再描画や依存解決に利用
 * - getter/setter経由のスコープ切り替えも考慮した設計
 */
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { raiseError } from "../../utils.js";
import { IWritableStateProxy, IWritableStateHandler } from "../types";
import { setStatePropertyRef } from "./setStatePropertyRef";

export function setByRef(
    target   : Object, 
    ref      : IStatePropertyRef,
    value    : any, 
    receiver : IWritableStateProxy,
    handler  : IWritableStateHandler
): any {
  // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
  // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
  if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.setters.intersection(ref.info.cumulativePathSet).size === 0) {
    return handler.engine.stateOutput.set(ref, value);
  }
  if (ref.info.pattern in target) {
    return setStatePropertyRef(handler, ref, () => {
      return Reflect.set(target, ref.info.pattern, value, receiver);
    });
  } else {
    const parentRef = ref.getParentRef() ?? raiseError({
      code: 'STATE-202',
      message: 'propRef.getParentRef() returned null',
      context: { where: 'setByRef', refPath: ref.info.pattern },
      docsUrl: '/docs/error-codes.md#state',
    });
    const parentValue = handler.accessor.getValue(parentRef);
    const lastSegment = ref.info.lastSegment;
    if (lastSegment === "*") {
      const index = ref.listIndex?.index ?? raiseError({
        code: 'STATE-202',
        message: 'propRef.listIndex?.index is undefined',
        context: { where: 'setByRef', refPath: ref.info.pattern },
        docsUrl: '/docs/error-codes.md#state',
      });
      return Reflect.set(parentValue, index, value);
    } else {
      return Reflect.set(parentValue, lastSegment, value);
    }
  }
}
