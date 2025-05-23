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
 * コメントノードをテキストノードに置き換えるユーティリティ関数。
 *
 * - ノードタイプが "Text" の場合のみ、コメントノードを空のテキストノードに置換する
 * - それ以外のノードタイプ（HTMLElement, Template, SVGElement）は何もしない
 *
 * @param node     対象ノード
 * @param nodeType ノードタイプ（"Text" | "HTMLElement" | "Template" | "SVGElement"）
 * @returns        置換後のノード（または元のノード）
 */
export function replaceTextNodeFromComment(node, nodeType) {
    return replaceTextNodeFn[nodeType]?.(node) ?? node;
}
