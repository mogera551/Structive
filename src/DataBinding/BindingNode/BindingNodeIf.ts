import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
import { IRenderer } from "../../Updater/types.js";
import { raiseError } from "../../utils.js";
import { createBindContent } from "../BindContent.js";
import { IBindContent, IBinding } from "../types";
import { BindingNodeBlock } from "./BindingNodeBlock.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeIf は、if バインディング（条件付き描画）を担当するノード実装。
 *
 * 役割:
 * - boolean 値に応じて BindContent（描画内容）の mount/unmount を制御
 * - 現在表示中の BindContent 集合を bindContents で参照可能
 *
 * 例外（代表）:
 * - BIND-201 Not implemented: assignValue は未実装
 * - BIND-201 Value is not boolean: applyChange で値が boolean ではない
 * - BIND-201 ParentNode is null: マウント先の親ノードが存在しない
 * - TMP-001 Template not found: 内部で参照するテンプレート未登録
 */
class BindingNodeIf extends BindingNodeBlock {
  #bindContent: IBindContent;
  #trueBindContents: IBindContent[];
  #falseBindContents: IBindContent[] = [];
  #bindContents: IBindContent[];

  get bindContents(): IBindContent[] {
    return this.#bindContents;
  }

  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);
    const blankInfo = getStructuredPathInfo("");
    const blankRef = getStatePropertyRef(blankInfo, null);
    this.#bindContent = createBindContent(
      this.binding, 
      this.id, 
      this.binding.engine,
      blankRef, 
    );
    this.#trueBindContents = this.#bindContents = [this.#bindContent];
  }

  /**
   * 値の直接代入は未実装。
   * Throws: BIND-201 Not implemented
   */
  assignValue(value: any): void {
    raiseError({
      code: 'BIND-201',
      message: 'Not implemented',
      context: { where: 'BindingNodeIf.assignValue', name: this.name },
      docsUrl: '/docs/error-codes.md#bind',
      severity: 'error',
    });
  }
  
  /**
   * 値を評価して true なら mount+applyChange、false なら unmount。
   * 既に更新済みの binding はスキップ。
   *
   * Throws:
   * - BIND-201 Value is not boolean
   * - BIND-201 ParentNode is null
   */
  applyChange(renderer: IRenderer): void {
    const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState, renderer.readonlyHandler);
    if (typeof filteredValue !== "boolean") {
      raiseError({
        code: 'BIND-201',
        message: 'Value is not boolean',
        context: { where: 'BindingNodeIf.update', valueType: typeof filteredValue },
        docsUrl: '/docs/error-codes.md#bind',
        severity: 'error',
      });
    }
    const parentNode = this.node.parentNode;
    if (parentNode == null) {
      raiseError({
        code: 'BIND-201',
        message: 'ParentNode is null',
        context: { where: 'BindingNodeIf.update', nodeType: this.node.nodeType },
        docsUrl: '/docs/error-codes.md#bind',
        severity: 'error',
      });
    }
    if (filteredValue) {
      this.#bindContent.mountAfter(parentNode, this.node);
      this.#bindContent.applyChange(renderer);
      this.#bindContents = this.#trueBindContents;
    } else {
      this.#bindContent.unmount();
      this.#bindContents = this.#falseBindContents;
    }
  }
}

/**
 * if バインディングノード生成用ファクトリ関数。
 * name / フィルタ / デコレータ設定に従い BindingNodeIf を生成する。
 */
export const createBindingNodeIf: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, decorates);
  }
