import { GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
import { raiseError } from "../utils";
const INITIAL_TRACE_SIZE = 100;
// キャッシュ情報
class CacheEntry {
    #listIndex;
    #info;
    #value;
    #version = 0;
    #refs = new Set(); // 依存先キャッシュエントリ
    constructor(info, listIndex) {
        this.#info = info;
        this.#listIndex = listIndex ? new WeakRef(listIndex) : null;
    }
    get dirty() {
        return this.getVersion() !== this.#version;
    }
    get info() {
        return this.#info;
    }
    get value() {
        if (this.#value instanceof WeakRef) {
            const value = this.#value.deref();
            if (value !== undefined)
                return value;
        }
        return this.#value; // string, number, null, undefined
    }
    set value(value) {
        if (typeof value === "object") {
            this.#value = new WeakRef(value);
        }
        else {
            this.#value = value; // string, number, null, undefined
        }
    }
    get listIndex() {
        return this.#listIndex?.deref() ?? null;
    }
    get version() {
        return this.#version;
    }
    set version(version) {
        this.#version = version;
    }
    #getVersion(tracePaths) {
        if (tracePaths.has(this.info.pattern))
            return -1; // 循環参照防止
        tracePaths.add(this.info.pattern);
        let maxVersion = this.version;
        for (const cacheEntry of this.#refs || []) {
            const v = cacheEntry.getVersion(tracePaths);
            if (v >= 0)
                maxVersion = Math.max(maxVersion, v);
        }
        return maxVersion;
    }
    getVersion(tracePaths) {
        if (typeof tracePaths === "undefined") {
            tracePaths = CacheEntry.getTracePaths();
            try {
                return this.#getVersion(tracePaths);
            }
            finally {
                CacheEntry.releaseTracePaths(tracePaths);
            }
        }
        else {
            return this.#getVersion(tracePaths);
        }
    }
    getValue(state, version) {
        if (version === this.version)
            return this.#value;
        // 違うスレッドが書き込んだので、例外を投げる
        if (version < this.version)
            raiseError("Concurrency error: version mismatch");
        if (this.dirty) {
            this.value = state[GetByRefSymbol](this.#info, this.listIndex);
        }
        this.version = version;
        return this.value;
    }
    setValue(state, value, version) {
        // 違うスレッドが書き込んだので、例外を投げる
        if (version < this.version)
            raiseError("Concurrency error: version mismatch");
        state[SetByRefSymbol](this.info, this.listIndex, value);
        this.value = value; // string, number, null, undefined
        this.version = version;
        return true;
    }
    static poolTracePaths = Array(INITIAL_TRACE_SIZE).fill(new Set());
    static getTracePaths() {
        if (this.poolTracePaths.length === 0) {
            return new Set(); // プールが空なら新しいセットを返す
        }
        return this.poolTracePaths.pop() ?? raiseError("No trace paths available");
    }
    static releaseTracePaths(tracePaths) {
        tracePaths.clear();
        this.poolTracePaths.push(tracePaths);
    }
}
export function createCacheEntry(info, listIndex) {
    return new CacheEntry(info, listIndex);
}
