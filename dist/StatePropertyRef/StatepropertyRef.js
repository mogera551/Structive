import { createRefKey } from "./getStatePropertyRef";
class StatePropertyRef {
    info;
    listIndex;
    key;
    constructor(info, listIndex) {
        this.info = info;
        this.listIndex = listIndex;
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
