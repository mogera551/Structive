import { getByRef as methodGetByRef } from "../methods/getByRef.js";
export function getByRef(target, prop, receiver, handler) {
    return (pattern, listIndex) => methodGetByRef(target, pattern, listIndex, receiver, handler);
}
