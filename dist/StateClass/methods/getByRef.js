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
 * @param ref      構造化パス情報とリストインデックス
 * @param force    キャッシュを無視して強制的に取得するかどうか
 * @param receiver  プロキシ
 * @param handler   状態ハンドラ
 * @returns         対象プロパティの値
 */
export function getByRef(target, ref, receiver, handler) {
    checkDependency(handler, ref);
    // 親子関係のあるgetterが存在する場合は、外部依存から取得
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.get(ref);
    }
    // パターンがtargetに存在する場合はgetter経由で取得
    if (ref.info.pattern in target) {
        return setStatePropertyRef(handler, ref, () => {
            return Reflect.get(target, ref.info.pattern, receiver);
        });
    }
    else {
        // 存在しない場合は親infoを辿って再帰的に取得
        const parentRef = ref.getParentRef() ?? raiseError({
            code: 'STATE-202',
            message: 'propRef.getParentRef() returned null',
            context: { where: 'getByRefWritable', refPath: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
        const parentValue = handler.accessor.getValue(parentRef);
        const lastSegment = ref.info.lastSegment;
        if (lastSegment === "*") {
            // ワイルドカードの場合はlistIndexのindexでアクセス
            const index = ref.listIndex?.index ?? raiseError({
                code: 'STATE-202',
                message: 'propRef.listIndex?.index is undefined',
                context: { where: 'getByRefWritable', refPath: ref.info.pattern },
                docsUrl: '/docs/error-codes.md#state',
            });
            return Reflect.get(parentValue, index);
        }
        else {
            // 通常のプロパティアクセス
            return Reflect.get(parentValue, lastSegment);
        }
    }
}
