import { IListIndex } from "./types";

interface INewListIndex extends IListIndex {
  version: number;
}

let version = 0;
class NewListIndex implements INewListIndex {
  #parentListIndex: INewListIndex | null = null;
  #pos: number = 0;
  #index: number = 0;
  #version: number;
  constructor(parentListIndex: INewListIndex | null, index: number) {
    this.#parentListIndex = parentListIndex;
    this.#pos = parentListIndex ? parentListIndex.position + 1 : 0;
    this.#index = index;
    this.#version = version;
  }

  get position() {
    return this.#pos;
  }

  get index() {
    return this.#index;
  }
  set index(value: number) {
    this.#index = value;
    this.#version = ++version;
    this.indexes[this.#pos] = value;
  }

  get version(): number {
    return this.#version;
  }

  #indexes: number[] | undefined;
  get indexes(): number[] {
    if (this.#parentListIndex === null) {
      if (typeof this.#indexes === "undefined") {
        this.#indexes = [this.#index];
      }
    } else {
      if (typeof this.#indexes === "undefined" || this.#parentListIndex.version > this.#version) {
        this.#indexes = [...this.#parentListIndex.indexes, this.#index];
      }
    }
    return this.#indexes;
  }
}

function createListIndex(parentListIndex: INewListIndex | null, index: number): INewListIndex {
  return new NewListIndex(parentListIndex, index);
}
