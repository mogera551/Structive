import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
class BindingNodeClassList extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeClassList.update: value is not array`);
        }
        const element = this.node;
        element.className = value.join(" ");
    }
}
export const createBindingNodeClassList = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassList(binding, node, name, filterFns, event);
};
