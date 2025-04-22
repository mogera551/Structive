import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { getStatePropertyRefId } from "../../StatePropertyRef/getStatePropertyRefId";
import { raiseError } from "../../utils";
import { IStateHandler, IStateProxy } from "../types";
import { setTracking } from "./setTracking";

function _getByRef(
  target   : Object, 
  info     : IStructuredPathInfo,
  listIndex: IListIndex | null,
  receiver : IStateProxy,
  handler  : IStateHandler
): any {
  if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
    const lastPattern = handler.lastTrackingStack;
    if (lastPattern.parentInfo !== info) {
      handler.engine.addDependentProp(lastPattern, info);
    }
  }

  let refId = 0;
  if (handler.cacheable) {
    refId = getStatePropertyRefId(info, listIndex);
    const value = handler.cache[refId];
    if (typeof value !== "undefined") {
      return value;
    }
    if (refId in handler.cache) {
      return undefined;
    }
  }

  let value;
  try {
    if (info.pattern in target) {
      if (info.wildcardCount > 0) {
        if (listIndex === null) {
          raiseError(`propRef.listIndex is null`);
        }
        return (value = handler.engine.setStatePropertyRef(info, listIndex, () => {
          return Reflect.get(target, info.pattern, receiver);
        }));
      } else {
        return (value = Reflect.get(target, info.pattern, receiver));
      }
    } else {
      const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
      const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
      const parentValue = getByRef(target, parentInfo, parentListIndex, receiver, handler);
      const lastSegment = info.lastSegment;
      if (lastSegment === "*") {
        const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
        return (value = Reflect.get(parentValue, index));
      } else {
        return (value = Reflect.get(parentValue, lastSegment));
      }
    }
  } finally {
    if (handler.cacheable && !(refId in handler.cache)) {
      handler.cache[refId] = value;
    }
  }
}

export function getByRef(
    target   : Object, 
    info     : IStructuredPathInfo,
    listIndex: IListIndex | null,
    receiver : IStateProxy,
    handler  : IStateHandler
  ): any {
    if (handler.engine.trackedGetters.has(info.pattern)) {
      return setTracking(info, handler, () => {
        return _getByRef(target, info, listIndex, receiver, handler);
      });
    } else {
      return _getByRef(target, info, listIndex, receiver, handler);
    }

  }
