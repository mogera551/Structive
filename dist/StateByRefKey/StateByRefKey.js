import { getStatePropertyRefKey } from "../StatePropertyRef/getStatePropertyRef";
class StateByRefKey {
    listIndexesByListValue = new Map();
    map = new Map();
    exists(path, listIndex) {
        const refKey = getStatePropertyRefKey(path, listIndex);
        return this.map.has(refKey);
    }
    getEntry(path, listIndex) {
        const refKey = getStatePropertyRefKey(path, listIndex);
        return this.map.get(refKey) ?? null;
    }
    setEntry(path, listIndex, entry) {
        const refKey = getStatePropertyRefKey(path, listIndex);
        this.map.set(refKey, entry);
    }
}
export function createStateByRefKey() {
    return new StateByRefKey();
}
