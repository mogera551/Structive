/**
 * get.ts
 *
 * StateClassのProxyトラップとして、プロパティアクセス時の値取得処理を担う関数（get）の実装です。
 *
 * 主な役割:
 * - 文字列プロパティの場合、特殊プロパティ（$1〜$9, $resolve, $getAll, $navigate）に応じた値やAPIを返却
 * - 通常のプロパティはgetResolvedPathInfoでパス情報を解決し、getListIndexでリストインデックスを取得
 * - getByRefで構造化パス・リストインデックスに対応した値を取得
 * - シンボルプロパティの場合はhandler.callableApi経由でAPIを呼び出し
 * - それ以外はReflect.getで通常のプロパティアクセスを実行
 *
 * 設計ポイント:
 * - $1〜$9は直近のStatePropertyRefのリストインデックス値を返す特殊プロパティ
 * - $resolve, $getAll, $navigateはAPI関数やルーターインスタンスを返す
 * - 通常のプロパティアクセスもバインディングや多重ループに対応
 * - シンボルAPIやReflect.getで拡張性・互換性も確保
 */
import { getRouter } from "../../Router/Router.js";
import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { raiseError } from "../../utils.js";
import { getListIndex } from "../methods/getListIndex.js";
import { IStateHandler, IStateProxy } from "../types.js";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, GetListIndexesByRefSymbol, SetByRefSymbol } from "../symbols.js";
import { trackDependency } from "../apis/trackDependency.js";
import { indexByIndexName } from "./indexByIndexName.js";
import { IStatePropertyRef } from "../../StatePropertyRef/types.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
import { resolve } from "../apis/resolve.js";
import { getByRef } from "../methods/getByRef.js";
import { setByRef } from "../methods/setByRef.js";
import { connectedCallback } from "../apis/connectedCallback.js";
import { disconnectedCallback } from "../apis/disconnectedCallback.js";
import { getAll } from "../apis/getAll.js";
import { getListIndexesByRef } from "../methods/getListIndexesByRef.js";


export function get(
  target  : Object, 
  prop    : PropertyKey, 
  receiver: IStateProxy,
  handler : IStateHandler
): any {
  const index = indexByIndexName[prop];
  if (typeof index !== "undefined") {
    const listIndex = handler.lastRefStack?.listIndex;
    return listIndex?.indexes[index] ?? raiseError({
      code: 'LIST-201',
      message: `ListIndex not found: ${prop.toString()}`,
      context: { prop: String(prop), indexes: listIndex?.indexes ?? null, index },
      docsUrl: '/docs/error-codes.md#list',
      severity: 'error',
    });
  }
  if (typeof prop === "string") {
    if (prop[0] === "$") {
      switch (prop) {
        case "$resolve":
          return resolve(target, prop, receiver, handler);
        case "$getAll":
          return getAll(target, prop, receiver, handler);
        case "$trackDependency":
          return trackDependency(target, prop, receiver, handler);
        case "$navigate":
          return (to:string) => getRouter()?.navigate(to);
        case "$component":
          return handler.engine.owner;
      }
    }
    const resolvedInfo = getResolvedPathInfo(prop);
    const listIndex = getListIndex(resolvedInfo, receiver, handler);
    const ref = getStatePropertyRef(resolvedInfo.info, listIndex);
    return getByRef(
      target, 
      ref,
      receiver,
      handler
    );

  } else if (typeof prop === "symbol") {
    if (handler.symbols.has(prop)) {
      switch (prop) {
        case GetByRefSymbol: 
          return (ref: IStatePropertyRef) => 
            getByRef(target, ref, receiver, handler);
        case SetByRefSymbol: 
          return (ref: IStatePropertyRef, value: any) => 
            setByRef(target, ref, value, receiver, handler);
        case GetListIndexesByRefSymbol:
          return (ref: IStatePropertyRef) =>
            getListIndexesByRef(target, ref, receiver, handler);
        case ConnectedCallbackSymbol:
          return () => connectedCallback(target, prop, receiver, handler);
        case DisconnectedCallbackSymbol: 
          return () => disconnectedCallback(target, prop, receiver, handler);
      }
    } else {
      return Reflect.get(
        target, 
        prop, 
        receiver
      );
    }
  }
}
