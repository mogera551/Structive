export function setTracking(info, handler, callback) {
    handler.secondToLastTrackingStack = handler.lastTrackingStack;
    handler.trackingStack.push(info);
    handler.lastTrackingStack = info;
    try {
        return callback();
    }
    finally {
        handler.trackingStack.pop();
        handler.lastTrackingStack = handler.trackingStack[handler.trackingStack.length - 1] ?? null;
        handler.secondToLastTrackingStack = handler.trackingStack[handler.trackingStack.length - 2] ?? null;
    }
}
