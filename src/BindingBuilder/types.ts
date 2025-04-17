import { CreateBindingNodeByNodeFn } from "../DataBinding/BindingNode/types";
import { CreateBindingStateByStateFn } from "../DataBinding/BindingState/types";

export type NodeType = "HTMLElement" | "SVGElement" | "Text" | "Template";

export type NodePath = number[];

export interface IDataBindAttributes {
  nodeType     : NodeType;    // ノードの種別
  nodePath     : NodePath;    // ノードのルート
  bindTexts    : IBindText[]; // BINDテキストの解析結果
  creatorByText: Map<IBindText, IBindingCreator>; // BINDテキストからバインディングクリエイターを取得
}

export interface IFilterText {
  name   : string; // フィルタ名
  options: string[]; // フィルタオプションの配列
}

export interface IBindText {
  nodeProperty     : string; // ノードプロパティ名
  stateProperty    : string; // ステートプロパティ名
  inputFilterTexts : IFilterText[]; // 入力フィルタのテキスト情報リスト
  outputFilterTexts: IFilterText[]; // 出力フィルタのテキスト情報リスト
  event            : string | null; // イベント名
}

export interface IBindingCreator {
  createBindingNode : CreateBindingNodeByNodeFn;
  createBindingState: CreateBindingStateByStateFn;
}