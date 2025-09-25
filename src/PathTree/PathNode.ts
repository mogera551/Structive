import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IPathNode } from "./types";

class NodePath implements IPathNode {
  parentPath: string;
  currentPath: string;
  name: string;
  childNodeByName: Map<string, IPathNode>;
  level: number;

  constructor(parentPath: string, name: string, level: number) {
    this.parentPath = parentPath;
    this.currentPath = parentPath ? parentPath + "." + name : name;
    this.name = name;
    this.level = level;
    this.childNodeByName = new Map<string, IPathNode>();
  }

  find(segments: string[], segIndex: number = 0): IPathNode | null {
    if (segIndex >= segments.length) {
      return null;
    }

    const currentSegment = segments[segIndex];
    const childNode = this.childNodeByName.get(currentSegment);

    if (childNode) {
      if (segIndex === segments.length - 1) {
        return childNode;
      }
      return childNode.find(segments, segIndex + 1);
    }
    return null;
  }

  appendChild(childName: string): IPathNode {
    let childNode = this.childNodeByName.get(childName);
    if (!childNode) {
      const currentPath = this.parentPath ? this.parentPath + "." + this.name : this.name;
      childNode = new NodePath(currentPath, childName, this.level + 1);
      this.childNodeByName.set(childName, childNode);
    }
    return childNode;
  }
}

export function createRootNode(): IPathNode {
  return new NodePath("", "", 0);
}

const cache = new Map<IPathNode, Map<string, IPathNode | null>>();
export function findPathNodeByPath(rootNode: IPathNode, path: string): IPathNode | null {
  let nodeCache = cache.get(rootNode);
  if (!nodeCache) {
    nodeCache = new Map<string, IPathNode>();
    cache.set(rootNode, nodeCache);
  }
  let cachedNode = nodeCache.get(path) ?? null;
  if (cachedNode) {
    return cachedNode;
  }
  const info = getStructuredPathInfo(path);
  cachedNode = rootNode.find(info.pathSegments);
  nodeCache.set(path, cachedNode);
  return cachedNode;
}

export function addPathNode(rootNode: IPathNode, path: string): IPathNode {
  const info = getStructuredPathInfo(path);
  if (info.parentPath === null) {
    return rootNode.appendChild(path);
  } else {
    let parentNode = findPathNodeByPath(rootNode, info.parentPath);
    if (parentNode === null) {
      parentNode = addPathNode(rootNode, info.parentPath);
    }
    return parentNode.appendChild(info.lastSegment);
  }
}
