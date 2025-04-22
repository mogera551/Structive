import { IStateHandler, IStateProxy } from "../types";

const CONNECTED_CALLBACK = "$connectedCallback";

export function connectedCallback(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return async () => {
    const callback = Reflect.get(target, CONNECTED_CALLBACK);
    if (typeof callback === "function") {
      await callback.call(target, receiver);
    }
  };
}