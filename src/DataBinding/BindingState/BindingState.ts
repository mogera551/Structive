import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { GetByRefSymbol, SetByRefSymbol, SetLoopContextSymbol } from "../../StateClass/symbols.js";
import { IStateProxy } from "../../StateClass/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { CreateBindingStateFn, IBindingState } from "./types";

/**
 * BindingStateクラスは、バインディング対象の状態（State）プロパティへのアクセス・更新・フィルタ適用を担当する実装です。
 *
 * 主な役割:
 * - バインディング対象の状態プロパティ（pattern, info）やリストインデックス（listIndex）を管理
 * - get valueで現在の値を取得し、get filteredValueでフィルタ適用後の値を取得
 * - initでリストバインディング時のループコンテキストやインデックス参照を初期化
 * - assignValueで状態プロキシに値を書き込む（双方向バインディング対応）
 * - バインディング情報をエンジンに登録し、依存解決や再描画を効率化
 *
 * 設計ポイント:
 * - ワイルドカードパス（配列バインディング等）にも対応し、ループごとのインデックス管理が可能
 * - フィルタ適用は配列で柔軟に対応
 * - createBindingStateファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingState implements IBindingState {
  #binding     : IBinding;
  #pattern     : string;
  #info        : IStructuredPathInfo;
  #listIndexRef: WeakRef<IListIndex> | null = null;
  #state       : IStateProxy;
  #filters     : Filters;
  get pattern(): string {
    return this.#pattern;
  }
  get info() {
    return this.#info;
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
    this.#pattern = pattern;
    this.#info = getStructuredPathInfo(pattern);
    this.#state = state;
    this.#filters = filters;
  }
  get value(): any {
    return this.#state[GetByRefSymbol](this.info, this.listIndex);
  }
  get filteredValue(): any {
    let value = this.value;
    for(let i = 0; i < this.#filters.length; i++) {
      value = this.#filters[i](value);
    }
    return value;
  }
  init(): void {
    if (this.info.wildcardCount > 0) {
      const lastWildcardPath = this.info.lastWildcardPath ?? 
        raiseError(`BindingState.init: wildcardLastParentPath is null`);
      const loopContext = this.binding.parentBindContent.loopContext?.find(lastWildcardPath) ?? 
        raiseError(`BindingState.init: loopContext is null`);
      this.#listIndexRef = loopContext.listIndexRef;
    }
    this.binding.engine.saveBinding(this.info, this.listIndex, this.binding);
  }
  assignValue(writeState: IStateProxy, value: any) {
    writeState[SetByRefSymbol](this.info, this.listIndex, value);
  }
}

export const createBindingState: CreateBindingStateFn = 
(name: string, filterTexts: IFilterText[]) => 
  (binding:IBinding, state: IStateProxy, filters:FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, state, name, filterFns);
  }
