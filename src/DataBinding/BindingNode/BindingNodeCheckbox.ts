import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeCheckboxクラスは、チェックボックス（input[type="checkbox"]）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（配列）に現在のvalueが含まれているかどうかでchecked状態を制御
 * - 値が配列でない場合はエラーを投げる
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで配列内にvalueが含まれていればchecked=true
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeCheckbox extends BindingNode {
  assignValue(value:any) {
    if (!Array.isArray(value)) {
      raiseError(`BindingNodeCheckbox.update: value is not array`, );
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
