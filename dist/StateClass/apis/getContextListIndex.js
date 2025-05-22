import { getContextListIndex as methodGetContextListIndex } from "../methods/getContextListIndex";
export function getContextListIndex(target, prop, receiver, handler) {
    return (structuredPath) => methodGetContextListIndex(handler, structuredPath);
}
