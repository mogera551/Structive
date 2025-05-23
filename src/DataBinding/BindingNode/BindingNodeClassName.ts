import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeClassNameクラスは、class属性の個別クラス名（例: class.active など）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（boolean）に応じて、指定クラス名（subName）をElementに追加・削除
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameからクラス名（subName）を抽出（例: "class.active" → "active"）
 * - assignValueでboolean値のみ許容し、型が異なる場合はエラー
 * - trueならclassList.add、falseならclassList.removeでクラス操作
 * - ファクトリ関数でフィルタ適用済みインスタンスを生成
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
      raiseError(`BindingNodeClassName.update: value is not boolean`);
    }
    const element = this.node as Element;
    if (value) {
      element.classList.add(this.subName);
    } else {
      element.classList.remove(this.subName);
    }
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
