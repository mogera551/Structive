import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { createBindContent } from "../BindContent.js";
import { BindingNodeBlock } from "./BindingNodeBlock.js";
/**
 * BindingNodeIfクラスは、ifバインディング（条件付き描画）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（boolean）に応じて、BindContent（描画内容）のマウント・アンマウントを制御
 * - true/false時のBindContent集合を管理し、現在の描画状態をbindContentsで取得可能
 *
 * 設計ポイント:
 * - assignValueでboolean型以外が渡された場合はエラー
 * - trueならBindContentをrender・mount、falseならunmount
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeIf extends BindingNodeBlock {
    #bindContent;
    #trueBindContents;
    #falseBindContents = new Set();
    #bindContents;
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        this.#bindContent = createBindContent(this.binding, this.id, this.binding.engine, "", null);
        this.#trueBindContents = this.#bindContents = new Set([this.#bindContent]);
    }
    assignValue(value) {
        if (typeof value !== "boolean") {
            raiseError(`BindingNodeIf.update: value is not boolean`);
        }
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError(`BindingNodeIf.update: parentNode is null`);
        }
        if (value) {
            this.#bindContent.mountAfter(parentNode, this.node);
            this.#bindContent.render();
            this.#bindContents = this.#trueBindContents;
        }
        else {
            this.#bindContent.unmount();
            this.#bindContents = this.#falseBindContents;
        }
    }
}
/**
 * ifバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeIfインスタンスを生成
 */
export const createBindingNodeIf = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, decorates);
};
