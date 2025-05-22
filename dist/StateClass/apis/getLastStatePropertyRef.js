import { getLastStatePropertyRef as methodGetLastStatePropertyRef } from "../methods/getLastStatePropertyRef.js";
export function getLastStatePropertyRef(target, prop, receiver, handler) {
    return () => methodGetLastStatePropertyRef(handler);
}
