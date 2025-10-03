import { Primitive } from "../types";
import { ICacheEntry } from "./types";

function isPrimitive(value: any): value is Primitive {
  return (value === null || value === undefined || typeof value !== 'object');
}

class CacheEntry implements ICacheEntry {
  #value: WeakRef<any> | Primitive;
  #version: number;
  constructor(value: any, version: number) {
    this.#value = isPrimitive(value) ? value : new WeakRef(value);
    this.#version = version;
  }

  get value() {
    return this.#value?.constructor === WeakRef ? this.#value.deref() : this.#value;
  }

  get version() {
    return this.#version;
  }

  setValue(value: any, version: number): void {
    this.#value = isPrimitive(value) ? value : new WeakRef(value);
    this.#version = version;
  }
}

export function createCacheEntry(value: any, version: number): ICacheEntry {
  return new CacheEntry(value, version);
}