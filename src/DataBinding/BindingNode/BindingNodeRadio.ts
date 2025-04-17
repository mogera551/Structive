import { createFilters } from "../../BindingBuilder/createFilters";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode";
import { CreateBindingNodeFn } from "./types";

class BindingNodeRadio extends BindingNode {
  assignValue(value:any) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    const element = this.node as HTMLInputElement;
    element.checked = value.toString() === element.value.toString();
  }
}

export const createBindingNodeRadio: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, event);
  }
