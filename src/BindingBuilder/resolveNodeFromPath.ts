import { NodePath } from "./types";

export function resolveNodeFromPath(root: Node, path: NodePath): Node | null {
  return path.reduce((node, index) => node?.childNodes[index] ?? null, root);
}