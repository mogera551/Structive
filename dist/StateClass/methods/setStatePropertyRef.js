export function setStatePropertyRef(handler, info, listIndex, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.structuredPathInfoStack.length) {
        handler.structuredPathInfoStack.push(null);
        handler.listIndexStack.push(null);
    }
    handler.structuredPathInfoStack[handler.refIndex] = info;
    handler.listIndexStack[handler.refIndex] = listIndex;
    try {
        return callback();
    }
    finally {
        handler.structuredPathInfoStack[handler.refIndex] = null;
        handler.listIndexStack[handler.refIndex] = null;
        handler.refIndex--;
    }
}
