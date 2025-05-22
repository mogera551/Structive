export function setStatePropertyRef(handler, info, listIndex, callback) {
    handler.structuredPathInfoStack.push(info);
    handler.listIndexStack.push(listIndex);
    try {
        callback();
    }
    finally {
        handler.structuredPathInfoStack.pop();
        handler.listIndexStack.pop();
    }
}
