import { NodeType } from "./types";
/**
 * バインド情報でノードプロパティを省略された場合のデフォルトのプロパティ名を取得
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {string | undefined} デフォルトのプロパティ名
 */
export declare function getDefaultName(node: Node, nodeType: NodeType): string | undefined;
