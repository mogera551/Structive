import { COMMENT_TEMPLATE_MARK } from "../../constants.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;
/**
 * BindingNodeBlockクラスは、テンプレートブロック（コメントノードによるテンプレート挿入部）を
 * バインディング対象とするためのバインディングノード実装です。
 *
 * 主な役割:
 * - コメントノード内のテンプレートIDを抽出し、idプロパティとして保持
 * - テンプレートブロックのバインディング処理の基盤となる
 *
 * 設計ポイント:
 * - コメントノードのテキストからテンプレートIDを抽出（COMMENT_TEMPLATE_MARK以降を数値変換）
 * - IDが取得できない場合はエラーを投げる
 * - 他のBindingNode系クラスと同様、フィルタやデコレータにも対応
 */
export class BindingNodeBlock extends BindingNode {
    #id;
    get id() {
        return this.#id;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN) ?? raiseError("BindingNodeBlock.id: invalid node");
        this.#id = Number(id);
    }
}
