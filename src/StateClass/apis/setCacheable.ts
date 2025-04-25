import { IStateHandler, IStateProxy } from "../types";
import { setCacheable as methodSetChargeable } from "../methods/setCacheable.js";

export function setCacheable(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return async (callback: () => Promise<void>) => {
    await methodSetChargeable(handler, callback);
  }
}