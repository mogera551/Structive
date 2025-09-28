import { raiseError } from "../utils";
import { createRefKey } from "./getStatePropertyRef";
class StatePropertyRef {
    info;
    #listIndexRef;
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
    }
    key;
    constructor(info, listIndex) {
        this.info = info;
        this.#listIndexRef = listIndex !== null ? new WeakRef(listIndex) : null;
        this.key = createRefKey(info, listIndex);
    }
}
const refByInfoByListIndex = new WeakMap();
const refByInfoByNull = new Map();
export function getStatePropertyRef(info, listIndex) {
    let ref = null;
    if (listIndex !== null) {
        let refByInfo = refByInfoByListIndex.get(listIndex);
        if (typeof refByInfo === "undefined") {
            refByInfo = new Map();
            refByInfoByListIndex.set(listIndex, refByInfo);
        }
        ref = refByInfo.get(info);
        if (typeof ref === "undefined") {
            ref = new StatePropertyRef(info, listIndex);
            refByInfo.set(info, ref);
        }
        return ref;
    }
    else {
        ref = refByInfoByNull.get(info);
        if (typeof ref === "undefined") {
            ref = new StatePropertyRef(info, null);
            refByInfoByNull.set(info, ref);
        }
        return ref;
    }
}
