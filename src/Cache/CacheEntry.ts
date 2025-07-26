import { IListIndex } from "../ListIndex/types";
import { GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
import { IWritableStateProxy } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { ICacheEntry } from "./types";

const INITIAL_TRACE_SIZE = 100;

type TracePaths = Set<string>;

// キャッシュ情報
class CacheEntry implements ICacheEntry {
  #listIndex: WeakRef<IListIndex> | null;
  #info: IStructuredPathInfo;
  #value: WeakRef<Object> | string | number | null | undefined;
  #version: number = 0;
  #refs: Set<ICacheEntry> = new Set(); // 依存先キャッシュエントリ

  constructor(info: IStructuredPathInfo, listIndex: IListIndex | null) {
    this.#info = info;
    this.#listIndex = listIndex ? new WeakRef(listIndex) : null;
  }

  get dirty(): boolean {
    return this.getVersion() !== this.#version;
  }

  get info(): IStructuredPathInfo {
    return this.#info;
  }

  get value(): any {
    if (this.#value instanceof WeakRef) {
      const value = this.#value.deref();
      if (value !== undefined) return value;
    }
    return this.#value; // string, number, null, undefined
  }

  set value(value: any) {
    if (typeof value === "object") {
      this.#value = new WeakRef(value);
    } else {
      this.#value = value; // string, number, null, undefined
    }
  }

  get listIndex(): IListIndex | null {
    return this.#listIndex?.deref() ?? null;
  }

  get version(): number {
    return this.#version;
  }

  set version(version: number) {
    this.#version = version;
  }

  #getVersion(tracePaths: Set<string>): number {
    if (tracePaths.has(this.info.pattern)) return -1; // 循環参照防止
    tracePaths.add(this.info.pattern);
    let maxVersion = this.version;
    for (const cacheEntry of this.#refs || []) {
      const v = cacheEntry.getVersion(tracePaths);
      if (v >= 0) maxVersion = Math.max(maxVersion, v);
    }
    return maxVersion;
  }
  getVersion(tracePaths?: Set<string>): number {
    if (typeof tracePaths === "undefined") {
      tracePaths = CacheEntry.getTracePaths();
      try {
        return this.#getVersion(tracePaths);
      } finally {
        CacheEntry.releaseTracePaths(tracePaths);
      }
    } else {
      return this.#getVersion(tracePaths);
    }
  }

  getValue(state: IWritableStateProxy, version: number) {
    if (version === this.version) return this.#value;
    // 違うスレッドが書き込んだので、例外を投げる
    if (version < this.version) raiseError("Concurrency error: version mismatch");
    if (this.dirty) {
      this.value = state[GetByRefSymbol](this.#info, this.listIndex);
    }
    this.version = version;
    return this.value;
  }

  setValue(state: IWritableStateProxy, value: any, version: number) {
    // 違うスレッドが書き込んだので、例外を投げる
    if (version < this.version) raiseError("Concurrency error: version mismatch");
    state[SetByRefSymbol](this.info, this.listIndex, value);
    this.value = value; // string, number, null, undefined
    this.version = version;
    return true;
  }

  static traces: Array<TracePaths> = 
    Array(INITIAL_TRACE_SIZE).fill(new Set())
  ;
  static getTracePaths(): TracePaths {
    if (this.traces.length === 0) {
      this.traces = Array(INITIAL_TRACE_SIZE).fill(new Set());
    }
    return this.traces.pop() ?? raiseError("No trace paths available");
  }
  static releaseTracePaths(tracePaths: TracePaths): void {
    tracePaths.clear();
    this.traces.push(tracePaths);
  }
}

export function createCacheEntry(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null
): ICacheEntry {
  return new CacheEntry(info, listIndex);
}

