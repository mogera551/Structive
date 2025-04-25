import { COMMENT_TEMPLATE_MARK } from "../../constants.js";
import { raiseError } from "../../utils.js";
import { BindingNode } from "./BindingNode.js";
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;
export class BindingNodeBlock extends BindingNode {
    #id;
    get id() {
        return this.#id;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN) ?? raiseError("BindingNodeBlock.id: invalid node");
        this.#id = Number(id);
    }
}
