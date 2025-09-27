import { raiseError } from "../../utils";
import { IStateHandler, IStateProxy } from "../types";

export function trackDependency(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (path: string): void => {
    const lastInfo = handler.refStack[handler.refIndex]?.info ?? raiseError("Internal error: refStack is null.");
    if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
      lastInfo.pattern !== path) {
      handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, path);
    }
  };
}
