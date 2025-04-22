import { getByRef as methodGetByRef } from "../methods/getByRef";
export function getByRef(target, prop, receiver, handler) {
    return (pattern, listIndex) => methodGetByRef(target, pattern, listIndex, receiver, handler);
}
