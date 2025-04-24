import { setByRef as methodSetByRef } from "../methods/setByRef";
export function setByRef(target, prop, receiver, handler) {
    return (pattern, listIndex, value) => methodSetByRef(target, pattern, listIndex, value, receiver, handler);
}
