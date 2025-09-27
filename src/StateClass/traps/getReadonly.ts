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
import { IReadonlyStateHandler, IReadonlyStateProxy } from "../types.js";
import { resolveReadonly } from "../apis/resolveReadonly.js";
import { GetByRefSymbol, SetCacheableSymbol } from "../symbols.js";
import { getByRefReadonly } from "../methods/getByRefReadonly.js";
import { IStructuredPathInfo } from "../../StateProperty/types.js";
import { setCacheable } from "../methods/setCacheable.js";
import { getAllReadonly } from "../apis/getAllReadonly.js";
import { trackDependency } from "../apis/trackDependency.js";
import { indexByIndexName2 } from "./indexByIndexName2.js";
import { IListIndex } from "../../ListIndex/types.js";
import { IStatePropertyRef } from "../../StatePropertyRef/types.js";


export function getReadonly(
  target  : Object, 
  prop    : PropertyKey, 
  receiver: IReadonlyStateProxy,
  handler : IReadonlyStateHandler
): any {
  const index = indexByIndexName2[prop];
  if (typeof index !== "undefined") {
    const listIndex = handler.listIndex2Stack[handler.refIndex];
    return listIndex?.indexes[index] ?? raiseError(`ListIndex not found: ${prop.toString()}`);
  }
  if (typeof prop === "string") {
    if (prop[0] === "$") {
      switch (prop) {
        case "$resolve":
          return resolveReadonly(target, prop, receiver, handler);
        case "$getAll":
          return getAllReadonly(target, prop, receiver, handler);
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
    return getByRefReadonly(
      target, 
      resolvedInfo.info, 
      listIndex, 
      receiver,
      handler
    );

  } else if (typeof prop === "symbol") {
    switch (prop) {
      case GetByRefSymbol: 
        return (ref: IStatePropertyRef) => 
          getByRefReadonly(target, ref.info, ref.listIndex, receiver, handler);
      case SetCacheableSymbol:
        return (callback: () => void) => setCacheable(handler, callback)
      default:
        return Reflect.get(
          target, 
          prop, 
          receiver
        );
    }
  }
}
