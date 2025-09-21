import { raiseError } from "../../utils";
import { checkDependency } from "./checkDependency";
import { setStatePropertyRef } from "./setStatePropertyRef";
/**
 * 構造化パス情報(info, listIndex)をもとに、状態オブジェクト(target)から値を取得する。
 *
 * - 依存関係の自動登録（trackedGetters対応時はsetTrackingでラップ）
 * - キャッシュ機構（handler.cacheable時はrefKeyでキャッシュ）
 * - ネスト・ワイルドカード対応（親infoやlistIndexを辿って再帰的に値を取得）
 * - getter経由で値取得時はSetStatePropertyRefSymbolでスコープを一時設定
 *
 * @param target    状態オブジェクト
 * @param info      構造化パス情報
 * @param listIndex リストインデックス（多重ループ対応）
 * @param receiver  プロキシ
 * @param handler   状態ハンドラ
 * @returns         対象プロパティの値
 */
export function getByRefReadonly(target, info, listIndex, receiver, handler) {
    checkDependency(handler, info, listIndex);
    // キャッシュが有効な場合はrefKeyで値をキャッシュ
    let refKey = '';
    if (handler.cacheable) {
        const key = (listIndex === null) ? info.sid : (info.sid + "#" + listIndex.sid);
        const value = handler.cache.get(key);
        if (typeof value !== "undefined") {
            return value;
        }
        if (handler.cache.has(key)) {
            return undefined;
        }
        refKey = key;
    }
    let value;
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存から取得
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(info) && handler.engine.pathManager.getters.intersection(info.cumulativePathSet).size === 0) {
            return value = handler.engine.stateOutput.get(info, listIndex);
        }
        // パターンがtargetに存在する場合はgetter経由で取得
        if (info.pattern in target) {
            return (value = setStatePropertyRef(handler, info, listIndex, () => {
                return Reflect.get(target, info.pattern, receiver);
            }));
        }
        else {
            // 存在しない場合は親infoを辿って再帰的に取得
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRefReadonly(target, parentInfo, parentListIndex, receiver, handler);
            const lastSegment = info.lastSegment;
            if (lastSegment === "*") {
                // ワイルドカードの場合はlistIndexのindexでアクセス
                const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return (value = Reflect.get(parentValue, index));
            }
            else {
                // 通常のプロパティアクセス
                return (value = Reflect.get(parentValue, lastSegment));
            }
        }
    }
    finally {
        // キャッシュが有効な場合は取得値をキャッシュ
        if (handler.cacheable) {
            handler.cache.set(refKey, value);
        }
    }
}
