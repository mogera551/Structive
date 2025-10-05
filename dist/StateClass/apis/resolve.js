/**
 * resolve.ts
 *
 * StateClassのAPIとして、パス（path）とインデックス（indexes）を指定して
 * Stateの値を取得・設定するための関数（resolve）の実装です。
 *
 * 主な役割:
 * - 文字列パス（path）とインデックス配列（indexes）から、該当するState値の取得・設定を行う
 * - ワイルドカードや多重ループを含むパスにも対応
 * - value未指定時は取得（getByRef）、指定時は設定（setByRef）を実行
 *
 * 設計ポイント:
 * - getStructuredPathInfoでパスを解析し、ワイルドカード階層ごとにリストインデックスを解決
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 * - getByRef/setByRefで値の取得・設定を一元的に処理
 * - 柔軟なバインディングやAPI経由での利用が可能
 */
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
export function resolve(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.lastRefStack?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
        if (info.wildcardParentInfos.length > indexes.length) {
            raiseError({
                code: 'STATE-202',
                message: `indexes length is insufficient: ${path}`,
                context: { path, expected: info.wildcardParentInfos.length, received: indexes.length },
                docsUrl: '/docs/error-codes.md#state',
                severity: 'error',
            });
        }
        // ワイルドカード階層ごとにListIndexを解決していく
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i];
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            const listIndexes = handler.accessor.getListIndexes(wildcardRef) ?? raiseError({
                code: 'LIST-201',
                message: `ListIndexes not found: ${wildcardParentPattern.pattern}`,
                context: { pattern: wildcardParentPattern.pattern },
                docsUrl: '/docs/error-codes.md#list',
                severity: 'error',
            });
            const index = indexes[i];
            listIndex = listIndexes[index] ?? raiseError({
                code: 'LIST-201',
                message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                context: { pattern: wildcardParentPattern.pattern, index },
                docsUrl: '/docs/error-codes.md#list',
                severity: 'error',
            });
        }
        // WritableかReadonlyかを判定して適切なメソッドを呼び出す
        const ref = getStatePropertyRef(info, listIndex);
        const hasSetValue = typeof value !== "undefined";
        if (!hasSetValue) {
            return handler.accessor.getValue(ref);
        }
        else {
            return handler.accessor.setValue(ref, value);
        }
    };
}
