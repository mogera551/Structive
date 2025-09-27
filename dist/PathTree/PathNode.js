import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
class NodePath {
    parentPath;
    currentPath;
    name;
    childNodeByName;
    level;
    constructor(parentPath, name, level) {
        this.parentPath = parentPath;
        this.currentPath = parentPath ? parentPath + "." + name : name;
        this.name = name;
        this.level = level;
        this.childNodeByName = new Map();
    }
    find(segments, segIndex = 0) {
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
    appendChild(childName) {
        let childNode = this.childNodeByName.get(childName);
        if (!childNode) {
            const currentPath = this.parentPath ? this.parentPath + "." + this.name : this.name;
            childNode = new NodePath(currentPath, childName, this.level + 1);
            this.childNodeByName.set(childName, childNode);
        }
        return childNode;
    }
}
export function createRootNode() {
    return new NodePath("", "", 0);
}
const cache = new Map();
export function findPathNodeByPath(rootNode, path) {
    let nodeCache = cache.get(rootNode);
    if (!nodeCache) {
        nodeCache = new Map();
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
export function addPathNode(rootNode, path) {
    const info = getStructuredPathInfo(path);
    if (info.parentPath === null) {
        return rootNode.appendChild(path);
    }
    else {
        let parentNode = findPathNodeByPath(rootNode, info.parentPath);
        if (parentNode === null) {
            parentNode = addPathNode(rootNode, info.parentPath);
        }
        return parentNode.appendChild(info.lastSegment);
    }
}
