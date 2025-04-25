import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { raiseError } from "../../utils.js";
import { getAll } from "../apis/getAll.js";
import { resolve } from "../apis/resolve.js";
import { getListIndex } from "../getListIndex.js";
import { getByRef } from "../methods/getByRef.js";
import { IStateHandler, IStateProxy } from "../types";

const matchIndexPropertyName = new RegExp(/^\$(\d+)$/);

export function get(
  target  : Object, 
  prop    : PropertyKey, 
  receiver: IStateProxy,
  handler  : IStateHandler
): any {
  let value;
  if (typeof prop === "string") {
    if (matchIndexPropertyName.test(prop)) {
      const number = prop.slice(1);
      const index = Number(number);
      const ref = handler.engine.getLastStatePropertyRef() ?? 
        raiseError(`get: this.engine.getLastStatePropertyRef() is null`);
      return ref.listIndex?.at(index - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
    } else if (prop === "$resolve") {
      return resolve(target, prop, receiver, handler);
    } else if (prop === "$getAll") {
      return getAll(target, prop, receiver, handler);
    } else {
      const resolvedInfo = getResolvedPathInfo(prop);
      const listIndex = getListIndex(resolvedInfo, handler.engine);
      value = getByRef(
        target, 
        resolvedInfo.info, 
        listIndex, 
        receiver,
        handler
      );
    }
  } else if (typeof prop === "symbol") {
    if (prop in handler.callableApi) {
      return handler.callableApi[prop](target, prop, receiver, handler);
    }
    value = Reflect.get(
      target, 
      prop, 
      receiver
    );
  }
  return value;
}
