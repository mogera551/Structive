import { COMMENT_TEMPLATE_MARK } from "../../constants.js";
import { Filters } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
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
  #id: number;
  get id(): number {
    return this.#id;
  }
  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
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