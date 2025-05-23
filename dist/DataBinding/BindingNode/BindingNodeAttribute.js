import { createFilters } from "../../BindingBuilder/createFilters.js";
import { BindingNode } from "./BindingNode.js";
/**
 * BindingNodeAttributeクラスは、属性バインディング（例: attr.src, attr.alt など）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - ノード属性名（subName）を抽出し、値を属性としてElementにセット
 * - null/undefined/NaNの場合は空文字列に変換してセット
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameから属性名（subName）を抽出（例: "attr.src" → "src"）
 * - assignValueで属性値を常に文字列として設定
 * - createBindingNodeAttributeファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingNodeAttribute extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.setAttribute(this.subName, value.toString());
    }
}
/**
 * 属性バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeAttributeインスタンスを生成
 */
export const createBindingNodeAttribute = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeAttribute(binding, node, name, filterFns, decorates);
};
