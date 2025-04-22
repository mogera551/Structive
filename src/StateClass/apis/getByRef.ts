import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
import { getByRef as methodGetByRef } from "../methods/getByRef";

export function getByRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (pattern: IStructuredPathInfo, listIndex: IListIndex | null) => 
    methodGetByRef(target, pattern, listIndex, receiver, handler);
} 
