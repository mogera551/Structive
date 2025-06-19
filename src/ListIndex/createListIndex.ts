/**
 * createListIndex.ts
 *
 * リストバインディングやループ処理で利用する「リストインデックス」管理クラスとファクトリ関数の実装です。
 *
 * 主な役割:
 * - ListIndexクラスで多重ループやネスト構造のインデックス情報をツリー状に管理
 * - indexes, position, lengthなどで階層的なインデックス情報を取得可能
 * - iterator/reverseIteratorで親子関係を辿るイテレータを提供
 * - atメソッドで指定位置のListIndexをキャッシュ付きで取得（WeakRefによるメモリ効率化）
 * - truncateで指定長さまでの親ListIndexを取得
 * - addで新たな子ListIndexを生成
 *
 * 設計ポイント:
 * - ListIndexは親子関係を持つことで多重ループやforバインディングに柔軟に対応
 * - atメソッドはキャッシュとWeakRefを活用し、GCフレンドリーかつ高速なインデックス参照を実現
 * - createListIndexファクトリで一貫した生成・管理が可能
 * - getMaxListIndexIdで現在の最大IDを取得可能（デバッグや管理用途）
 */
import { IListIndex } from "./types";

class ListIndex implements IListIndex {
  static id: number = 0;
  id              : number = ++ListIndex.id;
  sid             : string = this.id.toString();
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

  get length(): number {
    return (this.parentListIndex?.length ?? 0) + 1;
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

  #atcache:{[key:number]:(WeakRef<IListIndex> | null)} = {};
  at(position: number): IListIndex | null {
    const value = this.#atcache[position];
    if (typeof value !== "undefined") {
      return value ? (value.deref() ?? null) : null;
    }
    let listIndex: IListIndex | null = null;
    if (position >= 0) {
      let count = this.length - position - 1;
      listIndex = this;
      while(count > 0 && listIndex !== null) {
        listIndex = listIndex.parentListIndex;
        count--;
      } 
    } else {
      let iterator;
      position = - position - 1 
      iterator = this.reverseIterator();
      let next;
      while(position >= 0) {
        next = iterator.next();
        position--;
      }
      listIndex = next?.value ?? null;
    }
    this.#atcache[position] = listIndex ? new WeakRef(listIndex) : null;
    return listIndex;
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
