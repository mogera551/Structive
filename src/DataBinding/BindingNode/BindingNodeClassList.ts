import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * class 属性（classList）バインディング。
 *
 * - 値（配列）を空白区切りで結合して className へ反映
 *
 * Throws:
 * - BIND-201 Value is not array: 配列以外が渡された
 */
class BindingNodeClassList extends BindingNode {
  assignValue(value:any) {
    if (!Array.isArray(value)) {
      raiseError({
        code: 'BIND-201',
        message: 'Value is not array',
        context: { where: 'BindingNodeClassList.update', receivedType: typeof value },
        docsUrl: '/docs/error-codes.md#bind',
        severity: 'error',
      });
    }
    const element = this.node as Element;
    element.className = value.join(" ");
  }
}

/**
 * classList用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeClassListインスタンスを生成
 */
export const createBindingNodeClassList: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassList(binding, node, name, filterFns, decorates);
  }
