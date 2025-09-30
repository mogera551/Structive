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

  assignValue(value: any): void {
    raiseError({
      code: 'BIND-201',
      message: 'Not implemented',
      context: { where: 'BindingNodeIf.assignValue', name: this.name },
      docsUrl: '/docs/error-codes.md#bind',
      severity: 'error',
    });
  }
  
  applyChange(renderer: IRenderer): void {
    if (renderer.updatedBindings.has(this.binding)) return;
    const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState);
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
    renderer.updatedBindings.add(this.binding);
  }
}

/**
 * ifバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeIfインスタンスを生成
 */
export const createBindingNodeIf: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, decorates);
  }
