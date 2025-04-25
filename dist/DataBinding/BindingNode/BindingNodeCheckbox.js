import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
class BindingNodeCheckbox extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeCheckbox.update: value is not array`);
        }
        const element = this.node;
        element.checked = value.map(_val => _val.toString()).includes(element.value);
    }
}
export const createBindingNodeCheckbox = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeCheckbox(binding, node, name, filterFns, event);
};
