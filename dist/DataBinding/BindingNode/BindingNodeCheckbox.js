import { createFilters } from "../../BindingBuilder/createFilters";
import { raiseError } from "../../utils";
import { BindingNode } from "./BindingNode";
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
