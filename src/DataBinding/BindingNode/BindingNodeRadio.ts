import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { FilterWithOptions } from "../../Filter/types";
import { IStateProxy } from "../../StateClass/types.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

class BindingNodeRadio extends BindingNode {
  assignValue(readonlyState: IStateProxy, value:any) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    const element = this.node as HTMLInputElement;
    element.checked = value.toString() === element.value.toString();
  }
}

export const createBindingNodeRadio: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, decorates);
  }
