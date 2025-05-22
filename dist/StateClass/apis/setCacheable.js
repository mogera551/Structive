import { setCacheable as methodSetChargeable } from "../methods/setCacheable.js";
export function setCacheable(target, prop, receiver, handler) {
    return (callback) => {
        methodSetChargeable(handler, callback);
    };
}
