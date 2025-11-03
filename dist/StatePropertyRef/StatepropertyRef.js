import { raiseError } from "../utils";
function createRefKey(info, listIndex) {
    return (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
}
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
        this.key = createRefKey(info, listIndex);
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
        let refByInfo = refByInfoByListIndex.get(listIndex);
        if (typeof refByInfo === "undefined") {
            refByInfo = {};
            refByInfoByListIndex.set(listIndex, refByInfo);
        }
        ref = refByInfo[info.pattern];
        if (typeof ref === "undefined") {
            ref = new StatePropertyRef(info, listIndex);
            refByInfo[info.pattern] = ref;
        }
        return ref;
    }
    else {
        ref = refByInfoByNull[info.pattern];
        if (typeof ref === "undefined") {
            ref = new StatePropertyRef(info, null);
            refByInfoByNull[info.pattern] = ref;
        }
        return ref;
    }
}
