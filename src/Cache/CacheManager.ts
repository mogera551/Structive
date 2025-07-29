import { IComponentPathManager } from "../ComponentPath/types";
import { IListIndex } from "../ListIndex/types";
import { IReadonlyStateProxy, IWritableStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { createCacheEntry } from "./CacheEntry";
import { ICacheEntry, ICacheManager } from "./types";

class CacheManager implements ICacheManager {
  version: number = 0;
  entries: Map<string, ICacheEntry> = new Map();
  // CacheManager implementation details
  getVersion(): number {
    return ++this.version;
  }

  #getEntry(info: IStructuredPathInfo, listIndex: IListIndex | null): ICacheEntry | undefined {
    // Implementation to get value from cache
    const key = createRefKey(info, listIndex);
    return this.entries.get(key);
  }

  #setEntry(info: IStructuredPathInfo, listIndex: IListIndex | null, entry: ICacheEntry): void {
    // Implementation to set value in cache
    const key = createRefKey(info, listIndex);
    this.entries.set(key, entry);
  }

  getEntry(info: IStructuredPathInfo, listIndex: IListIndex | null): ICacheEntry | undefined {
    let entry = this.#getEntry(info, listIndex);
    if (typeof entry === "undefined") {
      entry = createCacheEntry(info, listIndex);
      this.#setEntry(info, listIndex, entry);
    }
    return entry;
  }

  getValue(state: IWritableStateProxy, info: IStructuredPathInfo, listIndex: IListIndex | null): any {
    const entry = this.getEntry(info, listIndex);
    return entry ? entry.getValue(state, this.getVersion()) : raiseError(`Cache entry not found for info: ${info.sid} and listIndex: ${listIndex ? listIndex.index : 'null'}`);
  }

  setValue(state: IWritableStateProxy, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): boolean {
    const entry = this.getEntry(info, listIndex);
    return entry ? entry.setValue(state, value, this.getVersion()) : raiseError(`Cache entry not found for info: ${info.sid} and listIndex: ${listIndex ? listIndex.index : 'null'}`);
  }


  
  build(state: IReadonlyStateProxy, pathManager: IComponentPathManager): void {
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

export function createCacheManager(): ICacheManager {
  return new CacheManager();
}