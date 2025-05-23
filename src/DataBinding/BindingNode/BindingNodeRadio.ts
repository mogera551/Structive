import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeRadioクラスは、ラジオボタン（input[type="radio"]）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値とinput要素のvalueが一致していればchecked=trueにする
 * - null/undefined/NaNの場合は空文字列に変換して比較
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで値を文字列化し、input要素のvalueと比較してcheckedを制御
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeRadio extends BindingNode {
  assignValue(value:any) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    const element = this.node as HTMLInputElement;
    element.checked = value.toString() === element.value.toString();
  }
}

/**
 * ラジオボタン用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeRadioインスタンスを生成
 */
export const createBindingNodeRadio: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, decorates);
  }
