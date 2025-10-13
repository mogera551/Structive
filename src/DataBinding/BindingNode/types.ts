import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { IReadonlyStateProxy } from "../../StateClass/types";
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IRenderer } from "../../Updater/types";
import { IBindContent, IBinding } from "../types";

/**
 * BindingNode関連の型定義ファイル。
 *
 * - 各種バインディングノード（プロパティ、属性、イベント、for/if等）の共通インターフェースやファクトリ型を定義
 * - 柔軟なバインディング記法やフィルタ・デコレータ対応のための型安全な設計
 */

/**
 * IBindingNode
 * - バインディングノード（DOMノードとバインディング情報の1対1対応）の共通インターフェース
 * - 値の更新・初期化・値の割り当て・リスト要素の更新などのメソッドを提供
 */
export interface IBindingNode {
  readonly node           : Node;
  readonly name           : string;
  readonly subName        : string;
  readonly decorates      : string[];
  readonly binding        : IBinding;
  readonly filters        : Filters;
  readonly isSelectElement: boolean;
  readonly isBlock        : boolean;
  readonly isFor          : boolean;
  readonly bindContents   : IBindContent[];
  readonly value        : any;
  readonly filteredValue: any;
  init(): void;
  assignValue(value: any): void;
  updateElements(listIndexes: IListIndex[], values: any[]): void;
  notifyRedraw(refs: IStatePropertyRef[]): void; // 親子関係を考慮してバインディングの更新を通知する

  applyChange(renderer: IRenderer): void; // バインディングの変更を適用する
}

/**
 * バインディングノード生成ファクトリ型
 * - name, フィルタ, デコレータ情報からバインディングノード生成関数を返す
 */
export type CreateBindingNodeByNodeFn = 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => IBindingNode;
export type CreateBindingNodeFn = 
  (name: string, filterTexts: IFilterText[], decorates: string[]) => CreateBindingNodeByNodeFn;
