import { COMMENT_TEMPLATE_MARK } from "../../constants.js";
import { Filters } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";

const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;

export class BindingNodeBlock extends BindingNode {
  #id: number;
  get id(): number {
    return this.#id;
  }
  constructor(
    binding: IBinding, 
    node   : Node, 
    name   : string,
    filters: Filters,
    event  : string | null
  ) {
    super(binding, node, name, filters, event);
    const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN) ?? raiseError("BindingNodeBlock.id: invalid node");
    this.#id = Number(id);
  }
    
}