import { IListIndex } from "./types";

class ListIndex implements IListIndex {
  static id: number = 0;
  id              : number = ++ListIndex.id;
  #parentListIndex: IListIndex | null = null;
  get parentListIndex(): IListIndex | null {
    return this.#parentListIndex;
  }
  index: number;
  get indexes(): number[] {
    const indexes = this.parentListIndex?.indexes ?? [];
    indexes.push(this.index);
    return indexes;
  }

  get position(): number {
    return (this.parentListIndex?.position ?? -1) + 1;
  }

  constructor(
    parentListIndex: IListIndex | null,
    index: number
  ) {
    this.#parentListIndex = parentListIndex;
    this.index = index;
  }
  
  truncate(length: number): IListIndex | null {
    let listIndex: IListIndex | null = this;
    while(listIndex !== null) {
      if (listIndex.position < length) return listIndex;
      listIndex = listIndex.parentListIndex;
    }
    return null;
  }
  add(value: number): IListIndex {
    return new ListIndex(this, value);
  }

  *reverseIterator(): Generator<IListIndex> {
    yield this;
    if (this.parentListIndex !== null) {
      yield* this.parentListIndex.reverseIterator();
    }
    return;
  }

  *iterator(): Generator<IListIndex> {
    if (this.parentListIndex !== null) {
      yield* this.parentListIndex.iterator();
    }
    yield this;
    return;
  }

  toString(): string {
    const parentListIndex = this.parentListIndex?.toString();
    return (parentListIndex !== null) ? parentListIndex + "," + this.index.toString() : this.index.toString();
  }

  at(position: number): IListIndex | null {
    let iterator;
    if (position >= 0) {
      iterator = this.iterator();
    } else {
      position = - position - 1 
      iterator = this.reverseIterator();
    }
    let next;
    while(position >= 0) {
      next = iterator.next();
      position--;
    }
    return next?.value ?? null;
  }
  
}

export function createListIndex(
  parentListIndex: IListIndex | null,
  index          : number
): IListIndex {
  return new ListIndex(parentListIndex, index);
}

export function getMaxListIndexId(): number {
  return ListIndex.id;
}
