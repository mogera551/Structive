import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { raiseError } from "../../utils.js";
import { SetStatePropertyRefSymbol } from "../symbols";
import { IStateHandler, IStateProxy } from "../types";
import { getByRef } from "./getByRef.js";

export function setByRef(
    target   : Object, 
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    value    : any, 
    receiver : IStateProxy,
    handler  : IStateHandler
): any {
  try {
    if (info.pattern in target) {
      if (info.wildcardCount > 0) {
        if (listIndex === null) {
          raiseError(`propRef.listIndex is null`);
        }
        return receiver[SetStatePropertyRefSymbol](info, listIndex, () => {
          return Reflect.set(target, info.pattern, value, receiver);
        });
      } else {
        return Reflect.set(target, info.pattern, value, receiver);
      }
    } else {
      const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
      const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
      const parentValue = getByRef(target, parentInfo, parentListIndex, receiver, handler);
      const lastSegment = info.lastSegment;
      if (lastSegment === "*") {
        const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
        return Reflect.set(parentValue, index, value);
      } else {
        return Reflect.set(parentValue, lastSegment, value);
      }
    }
  } finally {
    handler.engine.updater.addUpdatedStatePropertyRefValue(info, listIndex, value);
  }
}
