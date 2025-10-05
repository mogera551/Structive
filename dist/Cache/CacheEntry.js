import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../utils";
function isPrimitive(value) {
    return (value === null || value === undefined || typeof value !== 'object');
}
class CacheEntry {
    #value;
    #version = -1;
    #engine;
    #ref;
    #stacks = new Set();
    constructor(engine, ref) {
        this.#engine = engine;
        this.#ref = ref;
        this.#value = undefined;
    }
    get value() {
        return this.#value?.constructor === WeakRef ? this.#value.deref() : this.#value;
    }
    get version() {
        return this.#version;
    }
    setValue(value, version) {
        this.#value = isPrimitive(value) ? value : new WeakRef(value);
        this.#version = version;
    }
    getCacheEntry(ref) {
        const cacheEntry = this.#engine.getCacheEntry(ref);
        if (cacheEntry === null) {
            raiseError({
                code: 'CACHE-200',
                message: 'Cache entry is null',
                context: { where: 'CacheEntry.getCacheEntry', refPath: ref.info.pattern },
                docsUrl: '/docs/error-codes.md#cache',
            });
        }
        return cacheEntry;
    }
    isDirty(accessor, tracedRefs = new Set()) {
        if (this.#stacks.has(this.#ref)) {
            console.warn('Circular reference detected in cache entry dirty check:', Array.from(this.#stacks).map(r => r.key));
            return false;
        }
        this.#stacks.add(this.#ref);
        try {
            // すでにトレース済みの場合はスキップ
            if (tracedRefs.has(this.#ref)) {
                return false;
            }
            tracedRefs.add(this.#ref);
            // 自分のバージョンが0未満の場合は常にダーティとみなす
            if (this.#version < 0) {
                return true;
            }
            // 親の依存チェック
            const parentRef = this.#ref.getParentRef();
            if (parentRef !== null) {
                const parentCacheEntry = this.getCacheEntry(parentRef);
                if (this.version < parentCacheEntry.version)
                    return true;
                if (parentCacheEntry.isDirty(accessor, tracedRefs))
                    return true;
            }
            // 動的依存チェック
            const deps = this.#engine.pathManager.dynamicReverseDependencies.get(this.#ref.info.pattern);
            if (typeof deps === "undefined" || deps.size === 0) {
                return false;
            }
            for (const depPath of deps) {
                const depInfo = getStructuredPathInfo(depPath);
                if (depInfo.wildcardCount === 0) {
                    // ワイルドカードがない場合はそのままチェック
                    const depRef = getStatePropertyRef(depInfo, null);
                    const depCacheEntry = this.getCacheEntry(depRef);
                    if (this.version < depCacheEntry.version)
                        return true;
                    if (depCacheEntry.isDirty(accessor, tracedRefs))
                        return true;
                }
                else {
                    // ワイルドカードがある場合はリストインデックスをたどってチェック
                    const infos = depInfo.wildcardParentInfos;
                    const walk = (depRef, index, nextInfo) => {
                        const listIndexes = accessor.getListIndexes(depRef) || [];
                        if ((index + 1) < infos.length) {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const nextRef = getStatePropertyRef(nextInfo, listIndexes[i]);
                                if (walk(nextRef, index + 1, infos[index + 1]))
                                    return true;
                            }
                        }
                        else {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const subDepRef = getStatePropertyRef(depInfo, listIndexes[i]);
                                const depCacheEntry = this.getCacheEntry(subDepRef);
                                if (this.version < depCacheEntry.version)
                                    return true;
                                if (depCacheEntry.isDirty(accessor, tracedRefs))
                                    return true;
                            }
                        }
                        return false;
                    };
                    const startRef = getStatePropertyRef(depInfo.wildcardParentInfos[0], null);
                    if (walk(startRef, 0, depInfo.wildcardParentInfos[1] || null)) {
                        return true;
                    }
                }
            }
            return false;
        }
        finally {
            this.#stacks.delete(this.#ref);
        }
    }
}
export function createCacheEntry(engine, ref) {
    return new CacheEntry(engine, ref);
}
