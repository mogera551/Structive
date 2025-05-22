import { IStateHandler, IStateProxy } from "../types";
import { getContextListIndex as methodGetContextListIndex } from "../methods/getContextListIndex";

export function getContextListIndex(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return (structuredPath: string) => 
    methodGetContextListIndex(handler, structuredPath);
}