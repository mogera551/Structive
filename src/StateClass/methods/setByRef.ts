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
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { raiseError } from "../../utils.js";
import { SetStatePropertyRefSymbol } from "../symbols";
import { IStateHandler, IStateProxy } from "../types";
import { getByRef } from "./getByRef.js";

export function setByRef(
    target   : Object, 
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    value    : any, 
    receiver : IStateProxy,
    handler  : IStateHandler
): any {
  try {
    if (info.pattern in target) {
      if (info.wildcardCount > 0) {
        if (listIndex === null) {
          raiseError(`propRef.listIndex is null`);
        }
        return receiver[SetStatePropertyRefSymbol](info, listIndex, () => {
          return Reflect.set(target, info.pattern, value, receiver);
        });
      } else {
        return Reflect.set(target, info.pattern, value, receiver);
      }
    } else {
      const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
      const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
      const parentValue = getByRef(target, parentInfo, parentListIndex, receiver, handler);
      const lastSegment = info.lastSegment;
      if (lastSegment === "*") {
        const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
        return Reflect.set(parentValue, index, value);
      } else {
        return Reflect.set(parentValue, lastSegment, value);
      }
    }
  } finally {
    handler.engine.updater.addUpdatedStatePropertyRefValue(info, listIndex, value);
  }
}
