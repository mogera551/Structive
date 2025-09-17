export function getContextListIndex(handler, structuredPath) {
    const info = handler.structuredPathInfoStack[handler.refIndex];
    if (info == null) {
        return null;
    }
    const listIndex = handler.listIndex2Stack[handler.refIndex];
    if (listIndex == null) {
        return null;
    }
    const index = info.indexByWildcardPath[structuredPath];
    if (typeof index !== "undefined") {
        return listIndex.at(index);
    }
    return null;
}
