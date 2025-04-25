import { getAbsoluteNodePath } from "./getAbsoluteNodePath.js";
import { getBindingNodeCreator } from "./getBindingNodeCreator.js";
import { getBindingStateCreator } from "./getBindingStateCreator.js";
import { getDataBindText } from "./getDataBindText.js";
import { getNodeType } from "./getNodeType.js";
import { parseBindText } from "./parseBindText.js";
import { removeDataBindAttribute } from "./removeDataBindAttribute.js";
import { replaceTextNodeFromComment } from "./replaceTextNodeFromComment.js";
import { IBindingCreator, IBindText, IDataBindAttributes, NodePath, NodeType } from "./types";

class DataBindAttributes implements IDataBindAttributes {
  nodeType     : NodeType; // ノードの種別
  nodePath     : NodePath; // ノードのルート
  bindTexts    : IBindText[]; // BINDテキストの解析結果
  creatorByText: Map<IBindText, IBindingCreator> = new Map(); // BINDテキストからバインディングクリエイターを取得
  constructor(node: Node) {
    this.nodeType = getNodeType(node);
    const text = getDataBindText(this.nodeType, node);
    // CommentNodeをTextに置換、template.contentの内容が書き換わることに注意
    node = replaceTextNodeFromComment(node, this.nodeType);
    // data-bind属性を削除する
    removeDataBindAttribute(node, this.nodeType);

    this.nodePath = getAbsoluteNodePath(node);
    this.bindTexts = parseBindText(text);
    for(let i = 0; i < this.bindTexts.length; i++) {
      const bindText = this.bindTexts[i];
      const creator: IBindingCreator = {
        createBindingNode : getBindingNodeCreator(
          node, 
          bindText.nodeProperty, 
          bindText.inputFilterTexts,
          bindText.event
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

export function createDataBindAttributes(node: Node): IDataBindAttributes {
  return new DataBindAttributes(node);
}