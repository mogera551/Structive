import { createFilters } from "../../BindingBuilder/createFilters.js";
import { getDefaultName } from "../../BindingBuilder/getDefaultName.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
function isTwoWayBindable(element) {
    return element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement;
}
const defaultEventByName = {
    "value": "input",
    "checked": "change",
    "selected": "change",
};
class BindingNodeProperty extends BindingNode {
    get value() {
        // @ts-ignore
        return this.node[this.name];
    }
    get filteredValue() {
        let value = this.value;
        for (let i = 0; i < this.filters.length; i++) {
            value = this.filters[i](value);
        }
        return value;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const isElement = this.node instanceof HTMLElement;
        if (!isElement)
            return;
        if (!isTwoWayBindable(this.node))
            return;
        const defaultName = getDefaultName(this.node, "HTMLElement");
        if (defaultName !== this.name)
            return;
        if (decorates.length > 1)
            raiseError(`BindingNodeProperty: ${this.name} has multiple decorators`);
        const event = (decorates[0]?.startsWith("on") ? decorates[0]?.slice(2) : decorates[0]) ?? null;
        const eventName = event ?? defaultEventByName[this.name] ?? "readonly";
        if (eventName === "readonly" || eventName === "ro")
            return;
        this.node.addEventListener(eventName, () => {
            this.binding.updateStateValue(this.filteredValue);
        });
    }
    init() {
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        // @ts-ignore
        this.node[this.name] = value;
    }
}
export const createBindingNodeProperty = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeProperty(binding, node, name, filterFns, decorates);
};
