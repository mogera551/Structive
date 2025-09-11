import { createFilters } from "../../BindingBuilder/createFilters.js";
import { update2 } from "../../Updater2/Updater2.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
/**
 * BindingNodeEventクラスは、イベントバインディング（onClick, onInputなど）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - 指定イベント（on～）に対して、バインディングされた関数をイベントリスナーとして登録
 * - デコレータ（preventDefault, stopPropagation）によるイベント制御に対応
 * - ループコンテキストやリストインデックスも引数としてイベントハンドラに渡す
 * - ハンドラ実行時はstateProxyを生成し、Updater経由で非同期的に状態を更新
 *
 * 設計ポイント:
 * - nameからイベント名（subName）を抽出し、addEventListenerで登録
 * - バインディング値が関数でない場合はエラー
 * - デコレータでpreventDefault/stopPropagationを柔軟に制御
 * - ループ内イベントにも対応し、リストインデックスを引数展開
 */
class BindingNodeEvent extends BindingNode {
    #subName;
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        this.#subName = this.name.slice(2); // on～
        const element = node;
        element.addEventListener(this.subName, (e) => this.handler(e));
    }
    get subName() {
        return this.#subName;
    }
    update() {
        // 何もしない（イベントバインディングは初期化時のみ）
    }
    async handler(e) {
        const engine = this.binding.engine;
        const loopContext = this.binding.parentBindContent.currentLoopContext;
        const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
        const options = this.decorates;
        if (options.includes("preventDefault")) {
            e.preventDefault();
        }
        if (options.includes("stopPropagation")) {
            e.stopPropagation();
        }
        await update2(engine, loopContext, async (updater, state) => {
            // stateProxyを生成し、バインディング値を実行
            const func = this.binding.bindingState.getValue(state);
            if (typeof func !== "function") {
                raiseError(`BindingNodeEvent: ${this.name} is not a function.`);
            }
            await Reflect.apply(func, state, [e, ...indexes]);
        });
    }
}
/**
 * イベントバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeEventインスタンスを生成
 */
export const createBindingNodeEvent = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, decorates);
};
