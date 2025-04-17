import { createFilters } from "../../BindingBuilder/createFilters";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode";
import { CreateBindingNodeFn } from "./types";

class BindingNodeClassName extends BindingNode {
  #subName: string;
  get subName(): string {
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
    if (typeof value !== "boolean") {
      raiseError(`BindingNodeClassName.update: value is not boolean`);
    }
    const element = this.node as Element;
    if (value) {
      element.classList.add(this.subName);
    } else {
      element.classList.remove(this.subName);
    }
  }
}

export const createBindingNodeClassName: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassName(binding, node, name, filterFns, event);
  }
