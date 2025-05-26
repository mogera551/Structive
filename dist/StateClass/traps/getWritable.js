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
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol } from "../symbols.js";
import { getByRefWritable } from "../methods/getByRefWritable.js";
import { setByRef } from "../methods/setByRef.js";
import { resolveWritable } from "../apis/resolveWritable.js";
import { getAllWritable } from "../apis/getAllWritable.js";
import { connectedCallback } from "../apis/connectedCallback.js";
import { disconnectedCallback } from "../apis/disconnectedCallback.js";
export function getWritable(target, prop, receiver, handler) {
    if (typeof prop === "string") {
        if (prop.charCodeAt(0) === 36) {
            if (prop.length === 2) {
                const d = prop.charCodeAt(1) - 48;
                if (d >= 1 && d <= 9) {
                    const listIndex = handler.listIndexStack[handler.refIndex];
                    return listIndex?.at(d - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
                }
            }
            switch (prop) {
                case "$resolve":
                    return resolveWritable(target, prop, receiver, handler);
                case "$getAll":
                    return getAllWritable(target, prop, receiver, handler);
                case "$navigate":
                    return (to) => getRouter()?.navigate(to);
            }
        }
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        return getByRefWritable(target, resolvedInfo.info, listIndex, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        switch (prop) {
            case GetByRefSymbol:
                return (info, listIndex) => getByRefWritable(target, info, listIndex, receiver, handler);
            case SetByRefSymbol:
                return (info, listIndex, value) => setByRef(target, info, listIndex, value, receiver, handler);
            case ConnectedCallbackSymbol:
                return () => connectedCallback(target, prop, receiver, handler);
            case DisconnectedCallbackSymbol:
                return () => disconnectedCallback(target, prop, receiver, handler);
            default:
                return Reflect.get(target, prop, receiver);
        }
    }
}
