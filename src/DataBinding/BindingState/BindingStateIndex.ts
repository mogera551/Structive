import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { ILoopContext } from "../../LoopContext/types.js";
import { IReadonlyStateProxy, IStateProxy, IWritableStateProxy } from "../../StateClass/types";
import { IStatePropertyRef } from "../../StatePropertyRef/types.js";
import { IPropertyAccessor, IRenderer } from "../../Updater/types.js";
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
  #filters     : Filters;
  #loopContext : ILoopContext | null = null;
  get pattern(): string {
    return raiseError({
      code: 'BIND-301',
      message: 'Not implemented',
      context: { where: 'BindingStateIndex.pattern' },
      docsUrl: '/docs/error-codes.md#bind',
    });
  }
  get info() {
    return raiseError({
      code: 'BIND-301',
      message: 'Not implemented',
      context: { where: 'BindingStateIndex.info' },
      docsUrl: '/docs/error-codes.md#bind',
    });
  }
  get listIndex() {
    return this.#loopContext?.listIndex ?? raiseError({
      code: 'LIST-201',
      message: 'listIndex is null',
      context: { where: 'BindingStateIndex.listIndex' },
      docsUrl: '/docs/error-codes.md#list',
    });
  }
  get ref() {
    return this.#loopContext?.ref ?? raiseError({
      code: 'STATE-202',
      message: 'ref is null',
      context: { where: 'BindingStateIndex.ref' },
      docsUrl: '/docs/error-codes.md#state',
    });
  }
  get filters() {
    return this.#filters;
  }
  get binding() {
    return this.#binding;
  }
  constructor(
    binding: IBinding, 
    pattern: string, 
    filters: Filters
  ) {
    this.#binding = binding;
    const indexNumber = Number(pattern.slice(1));
    if (isNaN(indexNumber)) {
      raiseError({
        code: 'BIND-202',
        message: 'Pattern is not a number',
        context: { where: 'BindingStateIndex.constructor', pattern },
        docsUrl: '/docs/error-codes.md#bind',
      });
    }
    this.#indexNumber = indexNumber;
    this.#filters = filters;
  }
  getValue(accessor: IPropertyAccessor): any {
    return this.listIndex?.index ?? raiseError({
      code: 'LIST-201',
      message: 'listIndex is null',
      context: { where: 'BindingStateIndex.getValue' },
      docsUrl: '/docs/error-codes.md#list',
    });
  }
  getFilteredValue(accessor: IPropertyAccessor): any {
    let value = this.listIndex?.index ?? raiseError({
      code: 'LIST-201',
      message: 'listIndex is null',
      context: { where: 'BindingStateIndex.getFilteredValue' },
      docsUrl: '/docs/error-codes.md#list',
    });
    for(let i = 0; i < this.#filters.length; i++) {
      value = this.#filters[i](value);
    }
    return value;
  }
  init(): void {
    const loopContext = this.binding.parentBindContent.currentLoopContext ??
      raiseError({
        code: 'BIND-201',
        message: 'LoopContext is null',
        context: { where: 'BindingStateIndex.init' },
        docsUrl: '/docs/error-codes.md#bind',
      });
    const loopContexts = loopContext.serialize();
    this.#loopContext = loopContexts[this.#indexNumber - 1] ??
      raiseError({
        code: 'BIND-201',
        message: 'Current loopContext is null',
        context: { where: 'BindingStateIndex.init', indexNumber: this.#indexNumber },
        docsUrl: '/docs/error-codes.md#bind',
      });
    const bindings = this.binding.engine.bindingsByListIndex.get(this.listIndex);
    if (bindings === undefined) {
      this.binding.engine.bindingsByListIndex.set(this.listIndex, new Set([this.binding]));
    } else {
      bindings.add(this.binding);
    }
  }
  assignValue(accessor: IPropertyAccessor, value:any): void {
    raiseError({
      code: 'BIND-301',
      message: 'Not implemented',
      context: { where: 'BindingStateIndex.assignValue' },
      docsUrl: '/docs/error-codes.md#bind',
    });
  }
}

export const createBindingStateIndex: CreateBindingStateFn = 
(name: string, filterTexts: IFilterText[]) => 
  (binding:IBinding, filters:FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる

    return new BindingStateIndex(binding, name, filterFns);
  }
