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
import { getListIndex } from "../getListIndex.js";
import { getByRef } from "../methods/getByRef.js";
import { IStateProxy, IWritableStateHandler } from "../types.js";
import { getAll } from "../apis/getAll.js";
import { resolve } from "../apis/resolve.js";
import { getByRef as apiGetByRef } from "../apis/getByRef.js";
import { setByRef as apiSetByRef } from "../apis/setByRef.js";
import { connectedCallback } from "../apis/connectedCallback.js";
import { disconnectedCallback } from "../apis/disconnectedCallback.js";
import { setStatePropertyRef } from "../apis/setStatePropertyRef";
import { setLoopContext } from "../apis/setLoopContext";
import { getLastStatePropertyRef } from "../apis/getLastStatePropertyRef";
import { getContextListIndex } from "../apis/getContextListIndex";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, GetContextListIndexSymbol, GetLastStatePropertyRefSymbol, ResolveSymbol, SetByRefSymbol, SetLoopContextSymbol, SetStatePropertyRefSymbol } from "../symbols.js";

export function getWritable(
  target  : Object, 
  prop    : PropertyKey, 
  receiver: IStateProxy,
  handler  : IWritableStateHandler
): any {
  if (typeof prop === "string") {
    if (prop.charCodeAt(0) === 36) {
      if (prop.length === 2) {
        const d = prop.charCodeAt(1) - 48;
        if (d >= 1 && d <= 9) {
          const ref = receiver[GetLastStatePropertyRefSymbol]() ?? 
            raiseError(`get: receiver[GetLastStatePropertyRefSymbol]() is null`);
          return ref.listIndex?.at(d - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
        }
      }
      switch (prop) {
        case "$resolve":
          return resolve(target, prop, receiver, handler);
        case "$getAll":
          return getAll(target, prop, receiver, handler);
        case "$navigate":
          return (to:string) => getRouter()?.navigate(to);
      }
    }
    const resolvedInfo = getResolvedPathInfo(prop);
    const listIndex = getListIndex(resolvedInfo, receiver, handler);
    return getByRef(
      target, 
      resolvedInfo.info, 
      listIndex, 
      receiver,
      handler
    );

  } else if (typeof prop === "symbol") {
    switch (prop) {
      case GetByRefSymbol: return apiGetByRef; 
      case SetByRefSymbol: return apiSetByRef; 
      case ConnectedCallbackSymbol: return connectedCallback; 
      case DisconnectedCallbackSymbol: return disconnectedCallback; 
      case ResolveSymbol: return resolve; 
      case GetAllSymbol: return getAll;
      case SetStatePropertyRefSymbol: return setStatePropertyRef;
      case SetLoopContextSymbol: return setLoopContext;
      case GetLastStatePropertyRefSymbol: return getLastStatePropertyRef;
      case GetContextListIndexSymbol: return getContextListIndex;
      default:
        return Reflect.get(
          target, 
          prop, 
          receiver
        );
    }
  }
}
