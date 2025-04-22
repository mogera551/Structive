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
 * ノードからdata-bind属性を削除
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
 */
export function removeDataBindAttribute(node, nodeType) {
    return removeAttributeByNodeType[nodeType]?.(node);
}
