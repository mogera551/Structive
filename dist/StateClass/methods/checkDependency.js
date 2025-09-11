export function checkDependency(handler, info, listIndex) {
    // 動的依存関係の登録
    if (handler.refIndex >= 0) {
        const lastInfo = handler.structuredPathInfoStack[handler.refIndex];
        if (lastInfo !== null) {
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                lastInfo.pattern !== info.pattern) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
    }
}
