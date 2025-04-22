import { createFilters } from "../../BindingBuilder/createFilters";
import { GetByRefSymbol } from "../../StateClass/symbols";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
import { raiseError } from "../../utils";
class BindingState {
    #binding;
    #pattern;
    #info;
    #listIndexRef = null;
    #state;
    #filters;
    get pattern() {
        return this.#pattern;
    }
    get info() {
        return this.#info;
    }
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
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
    constructor(binding, state, pattern, filters) {
        this.#binding = binding;
        this.#pattern = pattern;
        this.#info = getStructuredPathInfo(pattern);
        this.#state = state;
        this.#filters = filters;
    }
    get value() {
        return this.#state[GetByRefSymbol](this.info, this.listIndex);
    }
    get filteredValue() {
        let value = this.value;
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        if (this.info.wildcardCount > 0) {
            const lastWildcardPath = this.info.lastWildcardPath ??
                raiseError(`BindingState.init: wildcardLastParentPath is null`);
            const loopContext = this.binding.parentBindContent.loopContext?.find(lastWildcardPath) ??
                raiseError(`BindingState.init: loopContext is null`);
            this.#listIndexRef = loopContext.listIndexRef;
        }
        this.binding.engine.saveBinding(this.info, this.listIndex, this.binding);
    }
}
export const createBindingState = (name, filterTexts) => (binding, state, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, state, name, filterFns);
};
