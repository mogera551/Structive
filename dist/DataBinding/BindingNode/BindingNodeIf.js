import { createFilters } from "../../BindingBuilder/createFilters";
import { raiseError } from "../../utils";
import { createBindContent } from "../BindContent";
import { BindingNodeBlock } from "./BindingNodeBlock";
class BindingNodeIf extends BindingNodeBlock {
    #bindContent;
    #trueBindContents;
    #falseBindContents = new Set();
    #bindContents;
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        this.#bindContent = createBindContent(this.binding, this.id, this.binding.engine, "", null);
        this.#trueBindContents = this.#bindContents = new Set([this.#bindContent]);
    }
    assignValue(value) {
        if (typeof value !== "boolean") {
            raiseError(`BindingNodeIf.update: value is not boolean`);
        }
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError(`BindingNodeIf.update: parentNode is null`);
        }
        if (value) {
            this.#bindContent.render();
            this.#bindContent.mountBefore(parentNode, this.node.nextSibling);
            this.#bindContents = this.#trueBindContents;
        }
        else {
            this.#bindContent.unmount();
            this.#bindContents = this.#falseBindContents;
        }
    }
}
export const createBindingNodeIf = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, event);
};
