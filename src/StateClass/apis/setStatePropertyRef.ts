import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
import { setStatePropertyRef as methodSetStatePropertyRef } from "../methods/setStatePropertyRef";

export function setStatePropertyRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return (info: IStructuredPathInfo, listIndex: IListIndex | null, callback: () => void) => 
    methodSetStatePropertyRef(handler, info, listIndex, callback);
}