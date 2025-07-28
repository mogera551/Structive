import { IListIndex } from "../ListIndex/types";
import { IWritableStateProxy } from "../StateClass/types";
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
}

export function createCacheManager(): ICacheManager {
  return new CacheManager();
}