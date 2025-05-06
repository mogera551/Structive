import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
class BindingNodeClassName extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    assignValue(value) {
        if (typeof value !== "boolean") {
            raiseError(`BindingNodeClassName.update: value is not boolean`);
        }
        const element = this.node;
        if (value) {
            element.classList.add(this.subName);
        }
        else {
            element.classList.remove(this.subName);
        }
    }
}
export const createBindingNodeClassName = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassName(binding, node, name, filterFns, decorates);
};
