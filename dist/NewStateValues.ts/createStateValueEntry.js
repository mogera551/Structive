class StateValueEntry {
    version;
    info;
    #listIndex;
    #value;
    constructor(version, info, listIndex, value) {
        this.version = version;
        this.info = info;
        this.#listIndex = (listIndex !== null) ? new WeakRef(listIndex) : null;
        this.#value = (value instanceof Object) ? new WeakRef(value) : value;
    }
    get listIndex() {
        return (this.#listIndex instanceof WeakRef) ? (this.#listIndex.deref() ?? null) : null;
    }
    getValue(version) {
        if (this.version > version) {
            throw new Error(`Entry version ${this.version} is greater than requested version ${version}`);
        }
        return (this.#value instanceof WeakRef) ? (this.#value.deref() ?? null) : null;
    }
    setValue(version, value) {
        if (this.version > version) {
            throw new Error(`Entry version ${this.version} is greater than requested version ${version}`);
        }
        this.version = version;
        this.#value = (value instanceof Object) ? value : new WeakRef(value);
    }
}
export function createStateValueEntry(version, info, listIndex, value) {
    return new StateValueEntry(version, info, listIndex, value);
}
