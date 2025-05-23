import { createFilters } from "../../BindingBuilder/createFilters.js";
import { BindingNode } from "./BindingNode.js";
/**
 * BindingNodeRadioクラスは、ラジオボタン（input[type="radio"]）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値とinput要素のvalueが一致していればchecked=trueにする
 * - null/undefined/NaNの場合は空文字列に変換して比較
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで値を文字列化し、input要素のvalueと比較してcheckedを制御
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeRadio extends BindingNode {
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.checked = value.toString() === element.value.toString();
    }
}
/**
 * ラジオボタン用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeRadioインスタンスを生成
 */
export const createBindingNodeRadio = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, decorates);
};
