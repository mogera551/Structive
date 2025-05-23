import { raiseError } from "../utils.js";
import { NodeType } from "./types";

const createNodeKey = (node:Node):string => node.constructor.name + "\t" + ((node instanceof Comment) ? (node.textContent?.[2] ?? "") : "");

type NodeTypeByNodeKey = {
  [nodeKey:string]:NodeType;
};

const nodeTypeByNodeKey:NodeTypeByNodeKey = {};

const getNodeTypeByNode = (node:Node):NodeType =>
  (node instanceof Comment && node.textContent?.[2] === ":") ? "Text" : 
  (node instanceof HTMLElement) ? "HTMLElement" :
  (node instanceof Comment && node.textContent?.[2] === "|") ? "Template" : 
  (node instanceof SVGElement) ? "SVGElement" : raiseError(`Unknown NodeType: ${node.nodeType}`);

/**
 * ノードのタイプ（"Text" | "HTMLElement" | "Template" | "SVGElement"）を判定・キャッシュするユーティリティ関数。
 *
 * - コメントノードの場合、3文字目が ":" なら "Text"、"|" なら "Template" と判定
 * - HTMLElement, SVGElement もそれぞれ判定
 * - 未知のノード型はエラー
 * - ノードごとに一意なキー（constructor名＋コメント種別）でキャッシュし、再判定を省略
 *
 * @param node    判定対象のノード
 * @param nodeKey キャッシュ用のノードキー（省略時は自動生成）
 * @returns       ノードタイプ（NodeType）
 */
export function getNodeType(
  node   : Node, 
  nodeKey: string = createNodeKey(node)
): NodeType {
  return nodeTypeByNodeKey[nodeKey] ?? (nodeTypeByNodeKey[nodeKey] = getNodeTypeByNode(node));
}
