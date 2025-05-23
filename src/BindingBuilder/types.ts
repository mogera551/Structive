import { CreateBindingNodeByNodeFn } from "../DataBinding/BindingNode/types";
import { CreateBindingStateByStateFn } from "../DataBinding/BindingState/types";

/**
 * バインディングビルダー関連の型定義ファイル。
 *
 * - テンプレート内のバインディング情報を構造化して扱うためのインターフェースや型を定義
 * - ノード種別、ノードパス、バインドテキスト、フィルタ情報、バインディング生成関数などを網羅
 */

/**
 * サポートするノード種別
 * - HTMLElement: 通常のHTML要素
 * - SVGElement : SVG要素
 * - Text       : テキストノード（特殊コメントを含む）
 * - Template   : テンプレートノード（特殊コメントを含む）
 */
export type NodeType = "HTMLElement" | "SVGElement" | "Text" | "Template";

/**
 * ノードの絶対パス（親からのインデックス配列）
 */
export type NodePath = number[];

/**
 * 1ノード分のバインディング属性情報
 */
export interface IDataBindAttributes {
  nodeType     : NodeType;    // ノードの種別
  nodePath     : NodePath;    // ノードのルート
  bindTexts    : IBindText[]; // BINDテキストの解析結果
  creatorByText: Map<IBindText, IBindingCreator>; // BINDテキストからバインディングクリエイターを取得
}

/**
 * フィルタ情報（フィルタ名＋オプション配列）
 */
export interface IFilterText {
  name   : string; // フィルタ名
  options: string[]; // フィルタオプションの配列
}

/**
 * バインドテキストの構造化情報
 */
export interface IBindText {
  nodeProperty     : string; // ノードプロパティ名
  stateProperty    : string; // ステートプロパティ名
  inputFilterTexts : IFilterText[]; // 入力フィルタのテキスト情報リスト
  outputFilterTexts: IFilterText[]; // 出力フィルタのテキスト情報リスト
  decorates        : string[]; // 修飾子のリスト
}

/**
 * バインディング生成関数群（ノード用・状態用）
 */
export interface IBindingCreator {
  createBindingNode : CreateBindingNodeByNodeFn;
  createBindingState: CreateBindingStateByStateFn;
}