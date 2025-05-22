import { raiseError } from "../../utils";
import { asyncSetStatePropertyRef } from "./asyncSetStatePropertyRef";
export async function setLoopContext(handler, loopContext, callback) {
    if (handler.loopContext) {
        raiseError('already in loop context');
    }
    handler.loopContext = loopContext;
    try {
        if (loopContext) {
            await asyncSetStatePropertyRef(handler, loopContext.info, loopContext.listIndex, callback);
        }
        else {
            await callback();
        }
    }
    finally {
        handler.loopContext = null;
    }
}
