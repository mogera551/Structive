import { raiseError } from "../../utils";
export function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const lastInfo = handler.lastRefStack?.info ?? raiseError({
            code: 'STATE-202',
            message: 'Internal error: lastRefStack is null',
            context: { where: 'trackDependency', path },
            docsUrl: '/docs/error-codes.md#state',
        });
        if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
            lastInfo.pattern !== path) {
            handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, path);
        }
    };
}
