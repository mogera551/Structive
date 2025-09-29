export function getContextListIndex(handler, structuredPath) {
    const ref = handler.lastRefStack;
    if (ref == null) {
        return null;
    }
    if (ref.info == null) {
        return null;
    }
    if (ref.listIndex == null) {
        return null;
    }
    const index = ref.info.indexByWildcardPath[structuredPath];
    if (typeof index !== "undefined") {
        return ref.listIndex.at(index);
    }
    return null;
}
