export function getAbsoluteNodePath(node) {
    let routeIndexes = [];
    while (node.parentNode !== null) {
        const childNodes = Array.from(node.parentNode.childNodes);
        routeIndexes = [childNodes.indexOf(node), ...routeIndexes];
        node = node.parentNode;
    }
    return routeIndexes;
}
