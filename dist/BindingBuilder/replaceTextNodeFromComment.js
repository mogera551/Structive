const replaceTextNodeText = (node) => {
    const textNode = document.createTextNode("");
    node.parentNode?.replaceChild(textNode, node);
    return textNode;
};
const replaceTextNodeFn = {
    Text: replaceTextNodeText,
    HTMLElement: undefined,
    Template: undefined,
    SVGElement: undefined
};
/**
 * コメントノードをテキストノードに置き換える
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
 */
export function replaceTextNodeFromComment(node, nodeType) {
    return replaceTextNodeFn[nodeType]?.(node) ?? node;
}
