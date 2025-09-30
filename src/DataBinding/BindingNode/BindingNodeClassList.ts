import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

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
