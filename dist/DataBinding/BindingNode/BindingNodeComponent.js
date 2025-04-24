import { createFilters } from "../../BindingBuilder/createFilters";
import { BindingNode } from "./BindingNode";
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
            bindings = new WeakSet();
            engine.bindingsByComponent.set(this.node, bindings);
        }
        bindings.add(this.binding);
    }
    assignValue(value) {
        const component = this.node;
        component.state.render(this.subName, value);
    }
}
export const createBindingNodeComponent = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, event);
};
