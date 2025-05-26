export function getContextListIndex(handler, structuredPath) {
    const info = handler.structuredPathInfoStack[handler.refIndex];
    if (typeof info === "undefined" || info === null) {
        return null;
    }
    const index = info.indexByWildcardPath[structuredPath];
    if (index >= 0) {
        const listIndex = handler.listIndexStack[handler.refIndex];
        if (typeof listIndex === "undefined") {
            return null;
        }
        return listIndex?.at(index) ?? null;
    }
    return null;
}
