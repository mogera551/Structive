import { IStateHandler, IStateProxy } from "../types";
import { getLastStatePropertyRef as methodGetLastStatePropertyRef } from "../methods/getLastStatePropertyRef.js";

export function getLastStatePropertyRef(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return () => 
    methodGetLastStatePropertyRef(handler);
}