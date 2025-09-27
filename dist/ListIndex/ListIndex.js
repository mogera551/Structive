let version = 0;
let id = 0;
class ListIndex {
    #parentListIndex = null;
    #pos = 0;
    #index = 0;
    #version;
    #id = ++id;
    #sid = this.#id.toString();
    constructor(parentListIndex, index) {
        this.#parentListIndex = parentListIndex;
        this.#pos = parentListIndex ? parentListIndex.position + 1 : 0;
        this.#index = index;
        this.#version = version;
    }
    get parentListIndex() {
        return this.#parentListIndex;
    }
    get id() {
        return this.#id;
    }
    get sid() {
        return this.#sid;
    }
    get position() {
        return this.#pos;
    }
    get length() {
        return this.#pos + 1;
    }
    get index() {
        return this.#index;
    }
    set index(value) {
        this.#index = value;
        this.#version = ++version;
        this.indexes[this.#pos] = value;
    }
    get version() {
        return this.#version;
    }
    get dirty() {
        if (this.#parentListIndex === null) {
            return false;
        }
        else {
            return this.#parentListIndex.dirty || this.#parentListIndex.version > this.#version;
        }
    }
    #indexes;
    get indexes() {
        if (this.#parentListIndex === null) {
            if (typeof this.#indexes === "undefined") {
                this.#indexes = [this.#index];
            }
        }
        else {
            if (typeof this.#indexes === "undefined" || this.dirty) {
                this.#indexes = [...this.#parentListIndex.indexes, this.#index];
                this.#version = version;
            }
        }
        return this.#indexes;
    }
    #listIndexes;
    get listIndexes() {
        if (this.#parentListIndex === null) {
            if (typeof this.#listIndexes === "undefined") {
                this.#listIndexes = [new WeakRef(this)];
            }
        }
        else {
            if (typeof this.#listIndexes === "undefined") {
                this.#listIndexes = [...this.#parentListIndex.listIndexes, new WeakRef(this)];
            }
        }
        return this.#listIndexes;
    }
    get varName() {
        return `${this.position + 1}`;
    }
    at(pos) {
        if (pos >= 0) {
            return this.listIndexes[pos]?.deref() || null;
        }
        else {
            return this.listIndexes[this.listIndexes.length + pos]?.deref() || null;
        }
    }
}
export function createListIndex(parentListIndex, index) {
    return new ListIndex(parentListIndex, index);
}
