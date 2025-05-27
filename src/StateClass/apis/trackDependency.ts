import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
import { IStateHandler, IStateProxy } from "../types";

export function trackDependency(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (path: string): void => {
    const info = getStructuredPathInfo(path);
    if (handler.lastTrackingStack != null) {
      // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
      if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
        handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
      }
    }
  };
}
