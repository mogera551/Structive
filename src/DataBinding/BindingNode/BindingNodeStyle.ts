import { createFilters } from "../../BindingBuilder/createFilters";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode";
import { CreateBindingNodeByNodeFn, CreateBindingNodeFn, IBindingNode } from "./types";

class BindingNodeStyle extends BindingNode {
  #subName: string;
  get subName():string {
    return this.#subName;
  }
  constructor(
    binding: IBinding, 
    node   : Node, 
    name   : string,
    filters: Filters,
    event  : string | null
  ) {
    super(binding, node, name, filters, event);
    const [, subName] = this.name.split(".");
    this.#subName = subName;
  }
  assignValue(value:any) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    const element = this.node as HTMLElement;
    element.style.setProperty(this.subName, value.toString());
  }
}

export const createBindingNodeStyle: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeStyle(binding, node, name, filterFns, event);
  }
