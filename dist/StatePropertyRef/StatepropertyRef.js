import { raiseError } from "../utils";
class StatePropertyRef {
    info;
    #listIndexRef;
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError({
            code: "LIST-201",
            message: "listIndex is null",
            context: { sid: this.info.sid, key: this.key },
            docsUrl: "./docs/error-codes.md#list",
        });
    }
    key;
    constructor(info, listIndex) {
        this.info = info;
        this.#listIndexRef = listIndex !== null ? new WeakRef(listIndex) : null;
        this.key = (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
    }
    get parentRef() {
        const parentInfo = this.info.parentInfo;
        if (!parentInfo)
            return null;
        const parentListIndex = (this.info.wildcardCount > parentInfo.wildcardCount ? this.listIndex?.at(-2) : this.listIndex) ?? null;
        return getStatePropertyRef(parentInfo, parentListIndex);
    }
}
const refByInfoByListIndex = new WeakMap();
const refByInfoByNull = {};
export function getStatePropertyRef(info, listIndex) {
    let ref = null;
    if (listIndex !== null) {
        let refByInfo;
        if (typeof (refByInfo = refByInfoByListIndex.get(listIndex)) === "undefined") {
            ref = new StatePropertyRef(info, listIndex);
            refByInfoByListIndex.set(listIndex, { [info.pattern]: ref });
        }
        else {
            if (typeof (ref = refByInfo[info.pattern]) === "undefined") {
                return refByInfo[info.pattern] = new StatePropertyRef(info, listIndex);
            }
        }
    }
    else {
        if (typeof (ref = refByInfoByNull[info.pattern]) === "undefined") {
            return refByInfoByNull[info.pattern] = new StatePropertyRef(info, null);
        }
    }
    return ref;
}
