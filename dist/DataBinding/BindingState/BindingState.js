import { createFilters } from "../../BindingBuilder/createFilters.js";
import { GetByRefSymbol, SetByRefSymbol } from "../../StateClass/symbols.js";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
/**
 * BindingStateクラスは、バインディング対象の状態（State）プロパティへのアクセス・更新・フィルタ適用を担当する実装です。
 *
 * 主な役割:
 * - バインディング対象の状態プロパティ（pattern, info）やリストインデックス（listIndex）を管理
 * - get valueで現在の値を取得し、get filteredValueでフィルタ適用後の値を取得
 * - initでリストバインディング時のループコンテキストやインデックス参照を初期化
 * - assignValueで状態プロキシに値を書き込む（双方向バインディング対応）
 * - バインディング情報をエンジンに登録し、依存解決や再描画を効率化
 *
 * 設計ポイント:
 * - ワイルドカードパス（配列バインディング等）にも対応し、ループごとのインデックス管理が可能
 * - フィルタ適用は配列で柔軟に対応
 * - createBindingStateファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingState {
    #binding;
    #pattern;
    #info;
    #listIndexRef = null;
    #filters;
    get pattern() {
        return this.#pattern;
    }
    get info() {
        return this.#info;
    }
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    constructor(binding, pattern, filters) {
        this.#binding = binding;
        this.#pattern = pattern;
        this.#info = getStructuredPathInfo(pattern);
        this.#filters = filters;
    }
    getValue(state) {
        return state[GetByRefSymbol](this.info, this.listIndex);
    }
    getFilteredValue(state) {
        let value = this.getValue(state);
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        if (this.info.wildcardCount > 0) {
            const lastWildcardPath = this.info.lastWildcardPath ??
                raiseError(`BindingState.init: wildcardLastParentPath is null`);
            const loopContext = this.binding.parentBindContent.currentLoopContext?.find(lastWildcardPath) ??
                raiseError(`BindingState.init: loopContext is null`);
            this.#listIndexRef = loopContext.listIndexRef;
        }
        this.binding.engine.saveBinding(this.info, this.listIndex, this.binding);
    }
    assignValue(writeState, value) {
        writeState[SetByRefSymbol](this.info, this.listIndex, value);
    }
}
export const createBindingState = (name, filterTexts) => (binding, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, name, filterFns);
};
