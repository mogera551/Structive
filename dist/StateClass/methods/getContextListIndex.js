export function getContextListIndex(handler, structuredPath) {
    const info = handler.structuredPathInfoStack[handler.structuredPathInfoStack.length - 1];
    const listIndex = handler.listIndexStack[handler.listIndexStack.length - 1];
    if (typeof info === "undefined" || typeof listIndex === "undefined") {
        return null;
    }
    const index = info.wildcardPaths.indexOf(structuredPath);
    if (index >= 0) {
        return listIndex?.at(index) ?? null;
    }
    return null;
}
