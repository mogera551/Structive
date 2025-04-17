import { raiseError } from "../utils";
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
 * ノードのタイプを取得
 * @param node ノード
 * @param nodeKey ノードキー
 * @returns {NodeType} ノードタイプ
 */
export function getNodeType(
  node   : Node, 
  nodeKey: string = createNodeKey(node)
): NodeType {
  return nodeTypeByNodeKey[nodeKey] ?? (nodeTypeByNodeKey[nodeKey] = getNodeTypeByNode(node));
}
