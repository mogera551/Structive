export function setStatePropertyRef(handler, ref, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.refStack.length) {
        handler.refStack.push(null);
    }
    handler.refStack[handler.refIndex] = ref;
    try {
        return callback();
    }
    finally {
        handler.refStack[handler.refIndex] = null;
        handler.refIndex--;
    }
}
