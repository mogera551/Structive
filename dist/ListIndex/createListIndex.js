class ListIndex {
    static id = 0;
    id = ++ListIndex.id;
    #parentListIndex = null;
    get parentListIndex() {
        return this.#parentListIndex;
    }
    index;
    get indexes() {
        const indexes = this.parentListIndex?.indexes ?? [];
        indexes.push(this.index);
        return indexes;
    }
    get position() {
        return (this.parentListIndex?.position ?? -1) + 1;
    }
    get length() {
        return (this.parentListIndex?.length ?? 0) + 1;
    }
    constructor(parentListIndex, index) {
        this.#parentListIndex = parentListIndex;
        this.index = index;
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
        if (value !== undefined) {
            return value ? (value.deref() ?? null) : null;
        }
        let iterator;
        if (position >= 0) {
            iterator = this.iterator();
        }
        else {
            position = -position - 1;
            iterator = this.reverseIterator();
        }
        let next;
        while (position >= 0) {
            next = iterator.next();
            position--;
        }
        const lisIndex = next?.value ?? null;
        this.#atcache[position] = lisIndex ? new WeakRef(lisIndex) : null;
        return lisIndex;
    }
}
export function createListIndex(parentListIndex, index) {
    return new ListIndex(parentListIndex, index);
}
export function getMaxListIndexId() {
    return ListIndex.id;
}
