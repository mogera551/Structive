import { raiseError } from "../utils";
class Entry {
    #parentEntry = null;
    #path;
    #listIndex = null;
    #value = null;
    #version = 0;
    constructor(parentEntry, path, listIndex = null, value, version) {
        this.#parentEntry = parentEntry;
        this.#path = path;
        this.#listIndex = listIndex ? new WeakRef(listIndex) : null;
        if (version !== undefined) {
            this.setValue(value, version);
        }
    }
    get path() {
        return this.#path;
    }
    get listIndex() {
        return this.#listIndex?.deref() ?? null;
    }
    getValue(version) {
        if (this.#version > version) {
            raiseError(`Version mismatch: requested version ${version}, current version ${this.#version}`);
        }
        if (this.#value instanceof WeakRef) {
            return this.#value?.deref();
        }
        else {
            return this.#value;
        }
    }
    setValue(newValue, version) {
        if (typeof newValue === "object" && newValue !== null) {
            this.#value = new WeakRef(newValue);
        }
        else {
            this.#value = newValue;
        }
        this.#version = version;
    }
    get disposable() {
        if (this.#value instanceof WeakRef) {
            return this.#value.deref() === undefined;
        }
        else {
            if (this.#parentEntry) {
                return this.#parentEntry.disposable;
            }
        }
        return false;
    }
}
export function createEntry(parentEntry, path, listIndex, value, version) {
    return new Entry(parentEntry, path, listIndex, value, version);
}
