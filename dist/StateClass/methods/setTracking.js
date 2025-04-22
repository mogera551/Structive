export function setTracking(info, handler, callback) {
    handler.trackingStack.push(info);
    handler.lastTrackingStack = info;
    try {
        return callback();
    }
    finally {
        handler.trackingStack.pop();
        handler.lastTrackingStack = handler.trackingStack[handler.trackingStack.length - 1] ?? null;
    }
}
