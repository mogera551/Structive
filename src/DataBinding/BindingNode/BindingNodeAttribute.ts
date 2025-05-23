import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeAttributeクラスは、属性バインディング（例: attr.src, attr.alt など）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - ノード属性名（subName）を抽出し、値を属性としてElementにセット
 * - null/undefined/NaNの場合は空文字列に変換してセット
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameから属性名（subName）を抽出（例: "attr.src" → "src"）
 * - assignValueで属性値を常に文字列として設定
 * - createBindingNodeAttributeファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingNodeAttribute extends BindingNode {
  #subName: string;
  get subName():string {
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
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    const element = this.node as Element;
    element.setAttribute(this.subName, value.toString());
  }
}

/**
 * 属性バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeAttributeインスタンスを生成
 */
export const createBindingNodeAttribute: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeAttribute(binding, node, name, filterFns, decorates);
  }
