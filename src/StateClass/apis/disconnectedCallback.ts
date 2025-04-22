import { IStateHandler, IStateProxy } from "../types";

const DISCONNECTED_CALLBACK = "$disconnectedCallback";

export function disconnectedCallback(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return async () => {
    const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
    if (typeof callback === "function") {
      await callback.call(target, receiver);
    }
  };
}