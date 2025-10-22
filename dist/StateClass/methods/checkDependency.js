export function checkDependency(handler, ref) {
    // 動的依存関係の登録
    if (handler.refIndex >= 0) {
        const lastInfo = handler.lastRefStack?.info ?? null;
        if (lastInfo !== null) {
            if (handler.engine.pathManager.onlyGetters.has(lastInfo.pattern) &&
                lastInfo.pattern !== ref.info.pattern) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, ref.info.pattern);
            }
        }
    }
}
