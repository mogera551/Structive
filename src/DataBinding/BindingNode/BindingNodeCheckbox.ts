import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

class BindingNodeCheckbox extends BindingNode {
  assignValue(value:any) {
    if (!Array.isArray(value)) {
      raiseError(`BindingNodeCheckbox.update: value is not array`, );
    }
    const element = this.node as HTMLInputElement;
    element.checked = value.map(_val => _val.toString()).includes(element.value);
  }
}

export const createBindingNodeCheckbox: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeCheckbox(binding, node, name, filterFns, event);
  }
