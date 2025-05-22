import { setStatePropertyRef as methodSetStatePropertyRef } from "../methods/setStatePropertyRef";
export function setStatePropertyRef(target, prop, receiver, handler) {
    return (info, listIndex, callback) => methodSetStatePropertyRef(handler, info, listIndex, callback);
}
