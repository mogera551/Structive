class ListIndex {
    static id = 0;
    id = ++ListIndex.id;
    sid = this.id.toString();
    index;
    constructor(parentListIndex, index) {
        this.#parentListIndex = parentListIndex;
        this.index = index;
    }
    #parentListIndex = null;
    get parentListIndex() {
        return this.#parentListIndex;
    }
    #indexes = undefined;
    get indexes() {
        if (typeof this.#indexes !== "undefined")
            return this.#indexes;
        this.#indexes = this.parentListIndex?.indexes ?? [];
        this.#indexes.push(this.index);
        return this.#indexes;
    }
    #position = undefined;
    get position() {
        if (typeof this.#position !== "undefined")
            return this.#position;
        this.#position = (this.parentListIndex?.position ?? -1) + 1;
        return this.#position;
    }
    #length = undefined;
    get length() {
        if (typeof this.#length !== "undefined")
            return this.#length;
        this.#length = (this.parentListIndex?.length ?? 0) + 1;
        return this.#length;
    }
    truncate(length) {
        let listIndex = this;
        while (listIndex !== null) {
            if (listIndex.position < length)
                return listIndex;
            listIndex = listIndex.parentListIndex;
        }
        return null;
    }
    add(value) {
        return new ListIndex(this, value);
    }
    *reverseIterator() {
        yield this;
        if (this.parentListIndex !== null) {
            yield* this.parentListIndex.reverseIterator();
        }
        return;
    }
    *iterator() {
        if (this.parentListIndex !== null) {
            yield* this.parentListIndex.iterator();
        }
        yield this;
        return;
    }
    toString() {
        const parentListIndex = this.parentListIndex?.toString();
        return (parentListIndex !== null) ? parentListIndex + "," + this.index.toString() : this.index.toString();
    }
    #atcache = {};
    at(position) {
        const value = this.#atcache[position];
        if (typeof value !== "undefined") {
            return value ? (value.deref() ?? null) : null;
        }
        let listIndex = null;
        if (position >= 0) {
            let count = this.length - position - 1;
            listIndex = this;
            while (count > 0 && listIndex !== null) {
                listIndex = listIndex.parentListIndex;
                count--;
            }
        }
        else {
            let iterator;
            position = -position - 1;
            iterator = this.reverseIterator();
            let next;
            while (position >= 0) {
                next = iterator.next();
                position--;
            }
            listIndex = next?.value ?? null;
        }
        this.#atcache[position] = listIndex ? new WeakRef(listIndex) : null;
        return listIndex;
    }
}
export function createListIndex(parentListIndex, index) {
    return new ListIndex(parentListIndex, index);
}
