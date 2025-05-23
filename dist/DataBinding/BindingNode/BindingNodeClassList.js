import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
/**
 * BindingNodeClassListクラスは、class属性（classList）のバインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（配列）を空白区切りのclass属性値としてElementにセット
 * - 値が配列でない場合はエラーを投げる
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで配列を受け取り、join(" ")でclassNameに反映
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeClassList extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeClassList.update: value is not array`);
        }
        const element = this.node;
        element.className = value.join(" ");
    }
}
/**
 * classList用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeClassListインスタンスを生成
 */
export const createBindingNodeClassList = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassList(binding, node, name, filterFns, decorates);
};
