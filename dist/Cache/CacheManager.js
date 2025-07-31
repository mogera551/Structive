import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { createCacheEntry } from "./CacheEntry";
class CacheManager {
    version = 0;
    entries = new Map();
    // CacheManager implementation details
    getVersion() {
        return ++this.version;
    }
    #getEntry(info, listIndex) {
        // Implementation to get value from cache
        const key = createRefKey(info, listIndex);
        return this.entries.get(key);
    }
    #setEntry(info, listIndex, entry) {
        // Implementation to set value in cache
        const key = createRefKey(info, listIndex);
        this.entries.set(key, entry);
    }
    getEntry(info, listIndex) {
        let entry = this.#getEntry(info, listIndex);
        if (typeof entry === "undefined") {
            entry = createCacheEntry(info, listIndex);
            this.#setEntry(info, listIndex, entry);
        }
        return entry;
    }
    getValue(state, info, listIndex) {
        const entry = this.getEntry(info, listIndex);
        return entry ? entry.getValue(state, this.getVersion()) : raiseError(`Cache entry not found for info: ${info.sid} and listIndex: ${listIndex ? listIndex.index : 'null'}`);
    }
    setValue(state, info, listIndex, value) {
        const entry = this.getEntry(info, listIndex);
        return entry ? entry.setValue(state, value, this.getVersion()) : raiseError(`Cache entry not found for info: ${info.sid} and listIndex: ${listIndex ? listIndex.index : 'null'}`);
    }
    build(state, pathManager) {
        // Implementation to build cache entries from state and path manager
        this.entries.clear();
        for (const path of pathManager.paths) {
            const info = getStructuredPathInfo(path);
            if (info.cumulativePaths.length > 0) {
                continue; // Skip paths that are not primitive
            }
        }
    }
}
export function createCacheManager() {
    return new CacheManager();
}
