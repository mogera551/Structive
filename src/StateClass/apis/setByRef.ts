import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
import { setByRef as methodSetByRef } from "../methods/setByRef";

export function setByRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (pattern: IStructuredPathInfo, listIndex: IListIndex | null, value: any) => 
    methodSetByRef(target, pattern, listIndex, value, receiver, handler);
}