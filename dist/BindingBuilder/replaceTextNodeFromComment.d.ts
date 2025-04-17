import { NodeType } from "./types";
/**
 * コメントノードをテキストノードに置き換える
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
 */
export declare function replaceTextNodeFromComment(node: Node, nodeType: NodeType): Node;
