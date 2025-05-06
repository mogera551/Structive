import { createFilters } from "../../BindingBuilder/createFilters.js";
import { BindingNode } from "./BindingNode.js";
class BindingNodeRadio extends BindingNode {
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.checked = value.toString() === element.value.toString();
    }
}
export const createBindingNodeRadio = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, decorates);
};
