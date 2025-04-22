import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo";
import { getListIndex } from "../getListIndex";
import { setByRef } from "../methods/setByRef";
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
