const DATASET_BIND_PROPERTY = 'data-bind';
const removeAttributeFromElement = (node) => {
    const element = node;
    element.removeAttribute(DATASET_BIND_PROPERTY);
};
const removeAttributeByNodeType = {
    HTMLElement: removeAttributeFromElement,
    SVGElement: removeAttributeFromElement,
    Text: undefined,
    Template: undefined,
};
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
export function removeDataBindAttribute(node, nodeType) {
    return removeAttributeByNodeType[nodeType]?.(node);
}
