import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * チェックボックス（input[type="checkbox"]）のバインディング。
 *
 * - 値（配列）に input.value が含まれるかで checked を制御
 *
 * Throws:
 * - BIND-201 Value is not array: 配列以外が渡された
 */
class BindingNodeCheckbox extends BindingNode {
  assignValue(value:any) {
    if (!Array.isArray(value)) {
      raiseError({
        code: 'BIND-201',
        message: 'Value is not array',
        context: { where: 'BindingNodeCheckbox.update', receivedType: typeof value },
        docsUrl: '/docs/error-codes.md#bind',
        severity: 'error',
      });
    }
    const element = this.node as HTMLInputElement;
    element.checked = value.map(_val => _val.toString()).includes(element.value);
  }
}

/**
 * チェックボックス用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeCheckboxインスタンスを生成
 */
export const createBindingNodeCheckbox: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeCheckbox(binding, node, name, filterFns, decorates);
  }
