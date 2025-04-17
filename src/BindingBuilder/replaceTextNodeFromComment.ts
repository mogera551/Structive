import { NodeType } from "./types";

const replaceTextNodeText = (node:Node):Node => {
  const textNode = document.createTextNode("");
  node.parentNode?.replaceChild(textNode, node);
  return textNode;
}

type ReplaceTextNodeFn = {
  [key in NodeType]: ((node:Node)=>Node) | undefined;
}

const replaceTextNodeFn:ReplaceTextNodeFn = {
  Text       : replaceTextNodeText,
  HTMLElement: undefined,
  Template   : undefined,
  SVGElement : undefined
}

/**
 * コメントノードをテキストノードに置き換える
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
 */
export function replaceTextNodeFromComment(
  node    : Node, 
  nodeType: NodeType
): Node {
  return replaceTextNodeFn[nodeType]?.(node) ?? node;
}
