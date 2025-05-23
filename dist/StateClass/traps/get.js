/**
 * get.ts
 *
 * StateClassのProxyトラップとして、プロパティアクセス時の値取得処理を担う関数（get）の実装です。
 *
 * 主な役割:
 * - 文字列プロパティの場合、特殊プロパティ（$1〜$9, $resolve, $getAll, $router）に応じた値やAPIを返却
 * - 通常のプロパティはgetResolvedPathInfoでパス情報を解決し、getListIndexでリストインデックスを取得
 * - getByRefで構造化パス・リストインデックスに対応した値を取得
 * - シンボルプロパティの場合はhandler.callableApi経由でAPIを呼び出し
 * - それ以外はReflect.getで通常のプロパティアクセスを実行
 *
 * 設計ポイント:
 * - $1〜$9は直近のStatePropertyRefのリストインデックス値を返す特殊プロパティ
 * - $resolve, $getAll, $routerはAPI関数やルーターインスタンスを返す
 * - 通常のプロパティアクセスもバインディングや多重ループに対応
 * - シンボルAPIやReflect.getで拡張性・互換性も確保
 */
import { getRouter } from "../../Router/Router.js";
import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { raiseError } from "../../utils.js";
import { getAll } from "../apis/getAll.js";
import { resolve } from "../apis/resolve.js";
import { getListIndex } from "../getListIndex.js";
import { getByRef } from "../methods/getByRef.js";
import { GetLastStatePropertyRefSymbol } from "../symbols.js";
export function get(target, prop, receiver, handler) {
    let value;
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
            if (prop === "$resolve") {
                return resolve(target, prop, receiver, handler);
            }
            else if (prop === "$getAll") {
                return getAll(target, prop, receiver, handler);
            }
            else if (prop === "$router") {
                return getRouter();
            }
        }
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        value = getByRef(target, resolvedInfo.info, listIndex, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        if (prop in handler.callableApi) {
            return handler.callableApi[prop](target, prop, receiver, handler);
        }
        value = Reflect.get(target, prop, receiver);
    }
    return value;
}
