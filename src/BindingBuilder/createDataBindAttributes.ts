import { getAbsoluteNodePath } from "./getAbsoluteNodePath.js";
import { getBindingNodeCreator } from "./getBindingNodeCreator.js";
import { getBindingStateCreator } from "./getBindingStateCreator.js";
import { getDataBindText } from "./getDataBindText.js";
import { getNodeType } from "./getNodeType.js";
import { parseBindText } from "./parseBindText.js";
import { removeDataBindAttribute } from "./removeDataBindAttribute.js";
import { replaceTextNodeFromComment } from "./replaceTextNodeFromComment.js";
import { IBindingCreator, IBindText, IDataBindAttributes, NodePath, NodeType } from "./types";

/**
 * DataBindAttributesクラスは、DOMノードからバインディング情報を抽出・解析し、
 * バインディング生成に必要な情報（ノード種別・パス・バインドテキスト・クリエイター）を管理します。
 *
 * - ノード種別やパスを特定
 * - data-bind属性やコメントノードからバインドテキストを取得・解析
 * - バインドテキストごとにバインディング生成関数（ノード用・状態用）を用意
 * - data-bind属性やコメントノードはパース後に削除・置換
 *
 * これにより、テンプレート内のバインディング定義を一元的に管理し、後続のバインディング構築処理を効率化します。
 */
class DataBindAttributes implements IDataBindAttributes {
  nodeType     : NodeType; // ノードの種別
  nodePath     : NodePath; // ノードのルート
  bindTexts    : IBindText[]; // BINDテキストの解析結果
  creatorByText: Map<IBindText, IBindingCreator> = new Map(); // BINDテキストからバインディングクリエイターを取得
  constructor(node: Node) {
    this.nodeType = getNodeType(node);
    const text = getDataBindText(this.nodeType, node);

    // コメントノードの場合はTextノードに置換（template.contentが書き換わる点に注意）
    node = replaceTextNodeFromComment(node, this.nodeType);

    // data-bind属性を削除（パース後は不要なため）
    removeDataBindAttribute(node, this.nodeType);

    this.nodePath = getAbsoluteNodePath(node);
    this.bindTexts = parseBindText(text);

    // 各バインドテキストごとにバインディング生成関数を用意
    for(let i = 0; i < this.bindTexts.length; i++) {
      const bindText = this.bindTexts[i];
      const creator: IBindingCreator = {
        createBindingNode : getBindingNodeCreator(
          node, 
          bindText.nodeProperty, 
          bindText.inputFilterTexts,
          bindText.decorates
        ),
        createBindingState: getBindingStateCreator(
          bindText.stateProperty, 
          bindText.outputFilterTexts
        ),
      }
      this.creatorByText.set(bindText, creator);
    }
  }

}

/**
 * 指定ノードからDataBindAttributesインスタンスを生成するファクトリ関数。
 */
export function createDataBindAttributes(node: Node): IDataBindAttributes {
  return new DataBindAttributes(node);
}