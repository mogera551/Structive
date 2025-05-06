import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

class BindingNodeClassList extends BindingNode {
  assignValue(value:any) {
    if (!Array.isArray(value)) {
      raiseError(`BindingNodeClassList.update: value is not array`);
    }
    const element = this.node as Element;
    element.className = value.join(" ");
  }
}

export const createBindingNodeClassList: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassList(binding, node, name, filterFns, decorates);
  }
