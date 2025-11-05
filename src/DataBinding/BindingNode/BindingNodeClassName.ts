import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * class の個別クラス名（例: class.active）に対するバインディング。
 *
 * - name から subName を抽出し、boolean 値で add/remove を切り替え
 *
 * Throws:
 * - BIND-201 Value is not boolean: boolean 以外が渡された
 */
class BindingNodeClassName extends BindingNode {
  #subName: string;
  get subName(): string {
    return this.#subName;
  }
  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);
    const [, subName] = this.name.split(".");
    this.#subName = subName;
  }

  assignValue(value:any) {
    if (typeof value !== "boolean") {
      raiseError({
        code: 'BIND-201',
        message: 'Value is not boolean',
        context: { where: 'BindingNodeClassName.update', receivedType: typeof value },
        docsUrl: '/docs/error-codes.md#bind',
        severity: 'error',
      });
    }
    const element = this.node as Element;
    element.classList.toggle(this.subName, value);
  }
}

/**
 * class名バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeClassNameインスタンスを生成
 */
export const createBindingNodeClassName: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassName(binding, node, name, filterFns, decorates);
  }
