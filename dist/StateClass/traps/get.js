import { getRouter } from "../../Router/Router.js";
import { getResolvedPathInfo } from "../../StateProperty/getResolvedPathInfo.js";
import { raiseError } from "../../utils.js";
import { getAll } from "../apis/getAll.js";
import { resolve } from "../apis/resolve.js";
import { getListIndex } from "../getListIndex.js";
import { getByRef } from "../methods/getByRef.js";
import { GetLastStatePropertyRefSymbol } from "../symbols.js";
export function get(target, prop, receiver, handler) {
    let value;
    if (typeof prop === "string") {
        if (prop.charCodeAt(0) === 36) {
            if (prop.length === 2) {
                const d = prop.charCodeAt(1) - 48;
                if (d >= 1 && d <= 9) {
                    const ref = receiver[GetLastStatePropertyRefSymbol]() ??
                        raiseError(`get: receiver[GetLastStatePropertyRefSymbol]() is null`);
                    return ref.listIndex?.at(d - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
                }
            }
            if (prop === "$resolve") {
                return resolve(target, prop, receiver, handler);
            }
            else if (prop === "$getAll") {
                return getAll(target, prop, receiver, handler);
            }
            else if (prop === "$router") {
                return getRouter();
            }
        }
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        value = getByRef(target, resolvedInfo.info, listIndex, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        if (prop in handler.callableApi) {
            return handler.callableApi[prop](target, prop, receiver, handler);
        }
        value = Reflect.get(target, prop, receiver);
    }
    return value;
}
