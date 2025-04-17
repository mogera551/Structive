import { NodeType } from "./types";

const DATASET_BIND_PROPERTY = 'data-bind';

const removeAttributeFromElement = (node:Node):void => {
  const element = node as Element;
  element.removeAttribute(DATASET_BIND_PROPERTY);
}

type RemoveAttributeByNodeType = {
  [key in NodeType]: ((node:Node)=>void) | undefined;
}

const removeAttributeByNodeType:RemoveAttributeByNodeType = {
  HTMLElement: removeAttributeFromElement,
  SVGElement : removeAttributeFromElement,
  Text       : undefined,
  Template   : undefined,
}

/**
 * ノードからdata-bind属性を削除
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
 */
export function removeDataBindAttribute(
  node    : Node, 
  nodeType: NodeType
):void {
  return removeAttributeByNodeType[nodeType]?.(node);
}
