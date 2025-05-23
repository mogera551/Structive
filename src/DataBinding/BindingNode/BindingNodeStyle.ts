import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeStyleクラスは、style属性（インラインスタイル）のバインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値を指定のCSSプロパティ（subName）としてHTMLElementにセット
 * - null/undefined/NaNの場合は空文字列に変換してセット
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameからCSSプロパティ名（subName）を抽出（例: "style.color" → "color"）
 * - assignValueで値を文字列化し、style.setPropertyで反映
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeStyle extends BindingNode {
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
    const element = this.node as HTMLElement;
    element.style.setProperty(this.subName, value.toString());
  }
}

/**
 * style属性バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeStyleインスタンスを生成
 */
export const createBindingNodeStyle: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeStyle(binding, node, name, filterFns, decorates);
  }
