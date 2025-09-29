export function setStatePropertyRef(handler, ref, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.refStack.length) {
        handler.refStack.push(null);
    }
    handler.refStack[handler.refIndex] = handler.lastRefStack = ref;
    try {
        return callback();
    }
    finally {
        handler.refStack[handler.refIndex] = null;
        handler.refIndex--;
        handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
    }
}
