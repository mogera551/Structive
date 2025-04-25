import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { GetByRefSymbol, SetByRefSymbol } from "../../StateClass/symbols.js";
import { IStateProxy } from "../../StateClass/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { CreateBindingStateFn, IBindingState } from "./types";

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
  assignValue(value:any) {
    const loopContext = this.binding.parentBindContent.currentLoopContext;
    const engine = this.binding.engine;
    const stateProxy = engine.stateProxy;
    const bindingState = this.binding.bindingState;
    if (loopContext) {
      engine.setLoopContext(loopContext, async () => {
        // @ts-ignore
        stateProxy[SetByRefSymbol](bindingState.info, bindingState.listIndex, value);
      });
    } else {
      // @ts-ignore
      stateProxy[SetByRefSymbol](bindingState.info, bindingState.listIndex, value);
    }
  }
}

export const createBindingState: CreateBindingStateFn = 
(name: string, filterTexts: IFilterText[]) => 
  (binding:IBinding, state: IStateProxy, filters:FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, state, name, filterFns);
  }
