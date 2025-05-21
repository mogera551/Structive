import { ILoopContext } from "../../LoopContext/types";
import { IStateHandler, IStateProxy } from "../types";
import { setLoopContext as methodSetLoopContext } from "../methods/setLoopContext.js";

export function setLoopContext(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
): Function {
  return (loopContext: ILoopContext | null, callback: () => Promise<void>) => 
    methodSetLoopContext(handler, loopContext, callback);
}