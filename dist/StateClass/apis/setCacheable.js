import { setCacheable as methodSetChargeable } from "../methods/setCacheable";
export function setCacheable(target, prop, receiver, handler) {
    return async (callback) => {
        await methodSetChargeable(handler, callback);
    };
}
