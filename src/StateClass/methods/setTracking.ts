import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

export function setTracking(info: IStructuredPathInfo, handler: IStateHandler, callback: () => any): any {
  handler.trackingStack.push(info);
  handler.lastTrackingStack = info;
  try {
    return callback();
  } finally {
    handler.trackingStack.pop();
    handler.lastTrackingStack = handler.trackingStack[handler.trackingStack.length - 1] ?? null;
  }
}
