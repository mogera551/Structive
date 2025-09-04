export function setStatePropertyRef(handler, info, listIndex, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.structuredPathInfoStack.length) {
        handler.structuredPathInfoStack.push(null);
        handler.listIndex2Stack.push(null);
    }
    handler.structuredPathInfoStack[handler.refIndex] = info;
    handler.listIndex2Stack[handler.refIndex] = listIndex;
    try {
        return callback();
    }
    finally {
        handler.structuredPathInfoStack[handler.refIndex] = null;
        handler.listIndex2Stack[handler.refIndex] = null;
        handler.refIndex--;
    }
}
