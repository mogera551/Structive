export function resolveNodeFromPath(root, path) {
    return path.reduce((node, index) => node?.childNodes[index] ?? null, root);
}
