import { NodePath } from "./types";

export function getAbsoluteNodePath(node: Node): NodePath {
  let routeIndexes: NodePath = [];
  while(node.parentNode !== null) {
    const childNodes = Array.from(node.parentNode.childNodes) as Node[];
    routeIndexes = [ childNodes.indexOf(node), ...routeIndexes ];
    node = node.parentNode;
  }
  return routeIndexes;
}