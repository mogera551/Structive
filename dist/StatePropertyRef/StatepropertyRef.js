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
    #parentRef = undefined;
    getParentRef() {
        if (typeof this.#parentRef !== "undefined") {
            return this.#parentRef;
        }
        const parentInfo = this.info.parentInfo;
        if (parentInfo === null)
            return (this.#parentRef = null);
        if (parentInfo.wildcardCount === this.info.wildcardCount) {
            return (this.#parentRef = getStatePropertyRef(parentInfo, this.listIndex));
        }
        else if (parentInfo.wildcardCount < this.info.wildcardCount) {
            if (parentInfo.wildcardCount > 0) {
                const parentListIndex = this.listIndex?.at(parentInfo.wildcardCount - 1) ?? raiseError({
                    code: 'BIND-201',
                    message: 'Inconsistent wildcard count between parentInfo and info',
                    context: { infoPattern: this.info.pattern, parentPattern: parentInfo.pattern },
                    docsUrl: '/docs/error-codes.md#bind',
                    severity: 'error',
                });
                return (this.#parentRef = getStatePropertyRef(parentInfo, parentListIndex));
            }
            else {
                return (this.#parentRef = getStatePropertyRef(parentInfo, null));
            }
        }
        else {
            raiseError({
                code: 'BIND-201',
                message: 'Inconsistent wildcard count between parentInfo and info',
                context: { infoPattern: this.info.pattern, parentPattern: parentInfo.pattern },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
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
