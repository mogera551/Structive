import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { IStateProxy, IWritableStateProxy } from "../../StateClass/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { CreateBindingStateFn, IBindingState } from "./types";

/**
 * BindingStateIndexクラスは、forバインディング等のループ内で利用される
 * インデックス値（$1, $2, ...）のバインディング状態を管理する実装です。
 *
 * 主な役割:
 * - ループコンテキストからインデックス値を取得し、value/filteredValueで参照可能にする
 * - バインディング時にbindingsByListIndexへ自身を登録し、依存解決や再描画を効率化
 * - フィルタ適用にも対応
 *
 * 設計ポイント:
 * - pattern（例: "$1"）からインデックス番号を抽出し、ループコンテキストから該当インデックスを取得
 * - initでループコンテキストやlistIndexRefを初期化し、バインディング情報をエンジンに登録
 * - assignValueは未実装（インデックスは書き換え不可のため）
 * - createBindingStateIndexファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingStateIndex implements IBindingState {
  #binding     : IBinding;
  #indexNumber : number;
  #listIndexRef: WeakRef<IListIndex> | null = null;
  #state       : IStateProxy;
  #filters     : Filters;
  get pattern(): string {
    return raiseError("Not implemented");
  }
  get info() {
    return raiseError("Not implemented");
  }
  get listIndex() {
    if (this.#listIndexRef === null) return null;
    return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
  }
  get state() {
    return this.#state;
  }
  get filters() {
    return this.#filters;
  }
  get binding() {
    return this.#binding;
  }
  constructor(
    binding: IBinding, 
    state  : IStateProxy, 
    pattern: string, 
    filters: Filters
  ) {
    this.#binding = binding;
    const indexNumber = Number(pattern.slice(1));
    if (isNaN(indexNumber)) {
      raiseError("BindingStateIndex: pattern is not a number");
    }
    this.#indexNumber = indexNumber;
    this.#state = state;
    this.#filters = filters;
  }
  get value(): any {
    return this.listIndex?.index ?? raiseError("listIndex is null");
  }
  get filteredValue(): any {
    let value = this.value;
    for(let i = 0; i < this.#filters.length; i++) {
      value = this.#filters[i](value);
    }
    return value;
  }
  init(): void {
    const loopContext = this.binding.parentBindContent.currentLoopContext ??
      raiseError(`BindingState.init: loopContext is null`);
    const loopContexts = loopContext.serialize();
    this.#listIndexRef = loopContexts[this.#indexNumber - 1].listIndexRef ??
      raiseError(`BindingState.init: listIndexRef is null`);
    const listIndex = this.listIndex ?? raiseError("listIndex is null");
    const bindings = this.binding.engine.bindingsByListIndex.get(listIndex);
    if (bindings === undefined) {
      this.binding.engine.bindingsByListIndex.set(listIndex, new Set([this.binding]));
    } else {
      bindings.add(this.binding);
    }
  }
  assignValue(writeState:IWritableStateProxy, value:any): void {
    raiseError("BindingStateIndex: assignValue is not implemented");
  }
}

export const createBindingStateIndex: CreateBindingStateFn = 
(name: string, filterTexts: IFilterText[]) => 
  (binding:IBinding, state: IStateProxy, filters:FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる

    return new BindingStateIndex(binding, state, name, filterFns);
  }
