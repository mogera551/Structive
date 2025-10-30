import { raiseError } from "../../utils";
export async function setLoopContext(handler, loopContext, callback) {
    if (handler.loopContext) {
        raiseError({
            code: 'STATE-301',
            message: 'already in loop context',
            context: { where: 'setLoopContext' },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    handler.loopContext = loopContext;
    try {
        if (loopContext) {
            if (handler.refStack.length === 0) {
                raiseError({
                    code: 'STC-002',
                    message: 'handler.refStack is empty in getByRef',
                });
            }
            handler.refIndex++;
            if (handler.refIndex >= handler.refStack.length) {
                handler.refStack.push(null);
            }
            handler.refStack[handler.refIndex] = handler.lastRefStack = loopContext.ref;
            try {
                await callback();
            }
            finally {
                handler.refStack[handler.refIndex] = null;
                handler.refIndex--;
                handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
            }
        }
        else {
            await callback();
        }
    }
    finally {
        handler.loopContext = null;
    }
}
