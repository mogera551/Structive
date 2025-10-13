import { COMMENT_TEMPLATE_MARK } from "../../constants.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;
/**
 * BindingNodeBlock は、テンプレートブロック（コメントノードで示すテンプレート挿入部）を
 * バインディング対象とする基底クラス。
 *
 * 役割:
 * - コメントのテキストからテンプレートIDを抽出し id として保持
 * - Block 系バインディングの共通処理を提供
 *
 * Throws:
 * - BIND-201 Invalid node: コメントノードから ID を抽出できない場合
 */
export class BindingNodeBlock extends BindingNode {
    #id;
    get id() {
        return this.#id;
    }
    get isBlock() {
        return true;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN) ?? raiseError({
            code: 'BIND-201',
            message: 'Invalid node',
            context: { where: 'BindingNodeBlock.id', textContent: this.node.textContent ?? null },
            docsUrl: '/docs/error-codes.md#bind',
            severity: 'error',
        });
        this.#id = Number(id);
    }
}
