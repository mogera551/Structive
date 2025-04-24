import { COMMENT_TEMPLATE_MARK } from "../../constants";
import { raiseError } from "../../utils";
import { BindingNode } from "./BindingNode";
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
