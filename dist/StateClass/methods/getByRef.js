import { raiseError } from "../../utils";
import { checkDependency } from "./checkDependency";
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
export function getByRef(target, ref, receiver, handler) {
    let value;
    const cacheable = handler.engine.pathManager.getters.has(ref.info.pattern);
    if (cacheable) {
        const cacheEntry = handler.engine.cache.get(ref);
        const revision = handler.updater.revisionByUpdatedPath.get(ref.info.pattern);
        if (typeof cacheEntry !== "undefined") {
            if (typeof revision === "undefined") {
                // 更新なし
                return cacheEntry.value;
            }
            else {
                if (cacheEntry.version > handler.updater.version) {
                    // これは非同期更新が発生した場合にありえる
                    return cacheEntry.value;
                }
                if (cacheEntry.version < handler.updater.version || cacheEntry.revision < revision) {
                    // 更新あり
                }
                else {
                    return cacheEntry.value;
                }
            }
        }
    }
    checkDependency(handler, ref);
    // 親子関係のあるgetterが存在する場合は、外部依存から取得
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.get(ref);
    }
    // パターンがtargetに存在する場合はgetter経由で取得
    if (ref.info.pattern in target) {
        handler.refIndex++;
        if (handler.refIndex >= handler.refStack.length) {
            handler.refStack.push(null);
        }
        handler.refStack[handler.refIndex] = handler.lastRefStack = ref;
        try {
            return value = Reflect.get(target, ref.info.pattern, receiver);
        }
        finally {
            handler.refStack[handler.refIndex] = null;
            handler.refIndex--;
            handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
            // キャッシュへ格納
            if (cacheable) {
                handler.engine.cache.set(ref, { value, version: handler.updater.version, revision: handler.updater.revision });
            }
            // リストの場合、差分計算する
            if (handler.engine.pathManager.lists.has(ref.info.pattern)) {
                handler.updater.calcListDiff(ref, value);
            }
        }
    }
    else {
        // 存在しない場合エラー
        raiseError({
            code: "STC-001",
            message: `Property "${ref.info.pattern}" does not exist in state.`,
            docsUrl: "./docs/error-codes.md#stc",
        });
    }
}
