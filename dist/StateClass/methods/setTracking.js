export function setTracking(info, handler, callback) {
    // 依存関係の自動登録
    const lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
    if (lastTrackingStack != null) {
        // gettersに含まれる場合はsetTrackingで依存追跡を有効化
        if (handler.engine.pathManager.getters.has(lastTrackingStack.pattern)) {
            handler.engine.addDependentProp(lastTrackingStack, info, "reference");
        }
    }
    handler.trackingIndex++;
    if (handler.trackingIndex >= handler.trackingStack.length) {
        handler.trackingStack.push(null);
    }
    handler.trackingStack[handler.trackingIndex] = info;
    handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
    try {
        return callback();
    }
    finally {
        handler.trackingStack[handler.trackingIndex] = null;
        handler.trackingIndex--;
        handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
    }
}
