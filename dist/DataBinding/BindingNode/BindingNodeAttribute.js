import { createFilters } from "../../BindingBuilder/createFilters";
import { BindingNode } from "./BindingNode";
class BindingNodeAttribute extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.setAttribute(this.subName, value.toString());
    }
}
export const createBindingNodeAttribute = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeAttribute(binding, node, name, filterFns, event);
};
