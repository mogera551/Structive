export function getLastStatePropertyRef(handler) {
    if (handler.structuredPathInfoStack.length === 0) {
        return null;
    }
    const info = handler.structuredPathInfoStack[handler.structuredPathInfoStack.length - 1];
    if (typeof info === "undefined") {
        return null;
    }
    const listIndex = handler.listIndexStack[handler.listIndexStack.length - 1];
    if (typeof listIndex === "undefined") {
        return null;
    }
    return { info, listIndex };
}
