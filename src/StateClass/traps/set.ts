import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { getListIndex } from "../getListIndex.js";
import { setByRef } from "../methods/setByRef.js";
import { IStateHandler, IStateProxy } from "../types";

export function set(
  target  : Object, 
  prop    : PropertyKey, 
  value   : any, 
  receiver: IStateProxy,
  handler : IStateHandler
): boolean {
  if (typeof prop === "string") {
    const resolvedInfo = getResolvedPathInfo(prop);
    const listIndex = getListIndex(resolvedInfo, handler.engine);
    return setByRef(
      target, 
      resolvedInfo.info, 
      listIndex, 
      value, 
      receiver,
      handler
    );
  } else {
    return Reflect.set(
      target, 
      prop, 
      value, 
      receiver
    );
  }
}
