import { createFilters } from "../../BindingBuilder/createFilters.js";
import { RenderSymbol } from "../../ComponentState/symbols.js";
import { BindingNode } from "./BindingNode.js";
class BindingNodeComponent extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    init() {
        const engine = this.binding.engine;
        let bindings = engine.bindingsByComponent.get(this.node);
        if (typeof bindings === "undefined") {
            bindings = new Set();
            engine.bindingsByComponent.set(this.node, bindings);
        }
        bindings.add(this.binding);
    }
    assignValue(value) {
        const component = this.node;
        component.state[RenderSymbol](this.subName, value);
    }
}
export const createBindingNodeComponent = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, event);
};
