import { raiseError } from "../../utils.js";
export class BindingNode {
    #binding;
    #node;
    #name;
    #filters;
    #event;
    #bindContents = new Set();
    get node() {
        return this.#node;
    }
    get name() {
        return this.#name;
    }
    get subName() {
        return this.#name;
    }
    get binding() {
        return this.#binding;
    }
    get event() {
        return this.#event;
    }
    get filters() {
        return this.#filters;
    }
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, event) {
        this.#binding = binding;
        this.#node = node;
        this.#name = name;
        this.#filters = filters;
        this.#event = event;
    }
    init() {
    }
    update() {
        this.assignValue(this.binding.bindingState.filteredValue);
    }
    assignValue(value) {
        raiseError(`BindingNode: assignValue not implemented`);
    }
    updateElements(listIndexes, values) {
        raiseError(`BindingNode: updateElements not implemented`);
    }
    get isSelectElement() {
        return this.node instanceof HTMLSelectElement;
    }
    get value() {
        return null;
    }
    get filteredValue() {
        return null;
    }
}
