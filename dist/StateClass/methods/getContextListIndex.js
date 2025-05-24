export function getContextListIndex(handler, structuredPath) {
    const info = handler.structuredPathInfoStack[handler.structuredPathInfoStack.length - 1];
    if (typeof info === "undefined") {
        return null;
    }
    const index = info.indexByWildcardPath[structuredPath];
    if (index >= 0) {
        const listIndex = handler.listIndexStack[handler.listIndexStack.length - 1];
        if (typeof listIndex === "undefined") {
            return null;
        }
        return listIndex?.at(index) ?? null;
    }
    return null;
}
