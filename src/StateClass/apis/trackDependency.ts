import { raiseError } from "../../utils";
import { IStateHandler, IStateProxy } from "../types";

export function trackDependency(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (path: string): void => {
    const lastInfo = handler.structuredPathInfoStack[handler.refIndex] ?? raiseError("Internal error: structuredPathInfoStack is null.");
    if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
      lastInfo.pattern !== path) {
      handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, path);
    }
  };
}
