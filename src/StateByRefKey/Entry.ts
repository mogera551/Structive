import { IListIndex } from "../ListIndex/types";
import { raiseError } from "../utils";

type Primitive = boolean | number | string | undefined | null | symbol | bigint;

class Entry implements Entry {
  #parentEntry: Entry | null = null;
  #path: string;
  #listIndex: WeakRef<IListIndex> | null = null;
  #value: WeakRef<Object> | Primitive = null;
  #version: number = 0;
  constructor(
    parentEntry: Entry | null,
    path: string, 
    listIndex: IListIndex | null = null,
    value?: Primitive | Object,
    version?: number,
  ) {
    this.#parentEntry = parentEntry;
    this.#path = path;
    this.#listIndex = listIndex ? new WeakRef(listIndex) : null;
    if (version !== undefined) {
      this.setValue(value, version);
    }
  }

  get path(): string {
    return this.#path;
  }

  get listIndex(): IListIndex | null {
    return this.#listIndex?.deref() ?? null;
  }

  getValue(version: number): Primitive | Object {
    if (this.#version > version) {
      raiseError(`Version mismatch: requested version ${version}, current version ${this.#version}`);
    }
    if (this.#value instanceof WeakRef) {
      return this.#value?.deref();
    } else {
      return this.#value;
    }
  }

  setValue(newValue: Primitive | Object, version: number): void {
    if (typeof newValue === "object" && newValue !== null) {
      this.#value = new WeakRef(newValue);
    } else {
      this.#value = newValue;
    }
    this.#version = version;
  }

  get disposable(): boolean {
    if (this.#value instanceof WeakRef) {
      return this.#value.deref() === undefined;
    } else {
      if (this.#parentEntry) {
        return this.#parentEntry.disposable;
      }
    }
    return false;
  }
}

export function createEntry(
  parentEntry: Entry | null,
  path: string,
  listIndex: IListIndex | null,
  value?: Primitive | Object,
  version?: number
): Entry {
  return new Entry(parentEntry, path, listIndex, value, version);
}
