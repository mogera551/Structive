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
 * 指定ノードから data-bind 属性を削除するユーティリティ関数。
 *
 * - ノードタイプ（HTMLElement, SVGElement）の場合のみ data-bind 属性を削除
 * - Text, Template ノードは対象外
 *
 * @param node     対象ノード
 * @param nodeType ノードタイプ（"HTMLElement" | "SVGElement" | "Text" | "Template"）
 * @returns        なし
 */
export function removeDataBindAttribute(
  node    : Node, 
  nodeType: NodeType
):void {
  return removeAttributeByNodeType[nodeType]?.(node);
}
