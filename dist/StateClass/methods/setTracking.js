export function setTracking(info, handler, callback) {
    handler.trackingIndex++;
    if (handler.trackingIndex >= handler.trackingStack.length) {
        handler.trackingStack.push(null);
    }
    handler.trackingStack[handler.trackingIndex] = info;
    handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex - 1] ?? null;
    try {
        return callback();
    }
    finally {
        handler.trackingIndex--;
        handler.trackingStack[handler.trackingIndex + 1] = null;
        handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex - 1] ?? null;
    }
}
