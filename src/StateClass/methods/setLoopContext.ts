import { ILoopContext } from "../../LoopContext/types";
import { raiseError } from "../../utils";
import { IStateHandler } from "../types";
import { asyncSetStatePropertyRef } from "./asyncSetStatePropertyRef";

export async function setLoopContext(
  handler: IStateHandler,
  loopContext: ILoopContext | null,
  callback: () => Promise<void>
): Promise<void> {
  if (handler.loopContext) {
    raiseError('already in loop context');
  }
  handler.loopContext = loopContext;
  try {
    if (loopContext) {
      await asyncSetStatePropertyRef(handler, loopContext.info, loopContext.listIndex, callback);
    } else {
      await callback();
    }
  } finally {
    handler.loopContext = null;
  }
}
