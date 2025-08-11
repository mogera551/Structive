/**
 * createListIndex.ts
 *
 * リストや多重ループのインデックス情報を管理するListIndexクラスと、その生成関数を提供するモジュールです。
 *
 * 主な役割:
 * - ListIndex: 多重リスト構造における各要素のインデックス情報（親リストとの階層関係、インデックス配列、位置、長さなど）を管理
 * - at(): 指定位置のListIndexを取得（キャッシュ・WeakRef対応）
 * - iterator()/reverseIterator(): 階層構造を順方向・逆方向にイテレート
 * - truncate()/add(): 階層の切り詰めや新しいインデックスの追加
 * - createListIndex(): ListIndexインスタンスの生成用ファクトリ関数
 *
 * 設計ポイント:
 * - 多重リストやネストしたforループにおけるインデックス管理を効率化
 * - 階層構造の親子関係を辿れるようにし、各種情報（indexes, position, length等）をキャッシュ
 * - at()メソッドはWeakRefを用いてメモリ効率とパフォーマンスを両立
 * - イテレータで階層を柔軟に走査可能
 */
import { IListIndex } from "./types";

class ListIndex implements IListIndex {
  static id: number = 0;
  id   : number = ++ListIndex.id;
  sid  : string = this.id.toString();
  index: number;

  constructor(
    parentListIndex: IListIndex | null,
    index: number
  ) {
    this.#parentListIndex = parentListIndex;
    this.index = index;
  }

  #parentListIndex: IListIndex | null = null;
  get parentListIndex(): IListIndex | null {
    return this.#parentListIndex;
  }

  #indexes: number[] | undefined = undefined;
  get indexes(): number[] {
    if (typeof this.#indexes !== "undefined") return this.#indexes;
    this.#indexes = this.parentListIndex?.indexes ?? [];
    this.#indexes.push(this.index);
    return this.#indexes;
  }

  #position: number | undefined = undefined;
  get position(): number {
    if (typeof this.#position !== "undefined") return this.#position;
    this.#position = (this.parentListIndex?.position ?? -1) + 1;
    return this.#position;
  }

  #length: number | undefined = undefined;
  get length(): number {
    if (typeof this.#length !== "undefined") return this.#length;
    this.#length = (this.parentListIndex?.length ?? 0) + 1;
    return this.#length;
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
