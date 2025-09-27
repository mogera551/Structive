import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../../utils";
import { asyncSetStatePropertyRef } from "./asyncSetStatePropertyRef";
export async function setLoopContext(handler, loopContext, callback) {
    if (handler.loopContext) {
        raiseError('already in loop context');
    }
    handler.loopContext = loopContext;
    try {
        if (loopContext) {
            const loopContextRef = getStatePropertyRef(loopContext.info, loopContext.listIndex);
            await asyncSetStatePropertyRef(handler, loopContextRef, callback);
        }
        else {
            await callback();
        }
    }
    finally {
        handler.loopContext = null;
    }
}
