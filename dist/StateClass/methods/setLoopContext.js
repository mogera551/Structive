import { raiseError } from "../../utils";
import { asyncSetStatePropertyRef } from "./asyncSetStatePropertyRef";
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
            await asyncSetStatePropertyRef(handler, loopContext.ref, callback);
        }
        else {
            await callback();
        }
    }
    finally {
        handler.loopContext = null;
    }
}
