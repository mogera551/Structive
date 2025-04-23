import { createFilters } from "../../BindingBuilder/createFilters";
import { getDefaultName } from "../../BindingBuilder/getDefaultName";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { SetByRefSymbol } from "../../StateClass/symbols";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode";
import { CreateBindingNodeFn } from "./types";

function isTwoWayBindable(element: HTMLElement): boolean {
  return element instanceof HTMLInputElement || 
    element instanceof HTMLTextAreaElement || 
    element instanceof HTMLSelectElement;
}

const defaultEventByName: {[key:string]: string} = {
  "value"   : "input",
  "checked" : "change",
  "selected": "change",
};

class BindingNodeProperty extends BindingNode {
  get value(): any {
    // @ts-ignore
    return this.node[this.name];
  }
  get filteredValue(): any {
    let value = this.value;
    for(let i = 0; i < this.filters.length; i++) {
      value = this.filters[i](value);
    }
    return value;
  }
  constructor(
    binding: IBinding, 
    node   : Node, 
    name   : string,
    filters: Filters,
    event  : string | null
  ) {
    super(binding, node, name, filters, event);

    const isElement = this.node instanceof HTMLElement;
    if (!isElement) return;
    if (!isTwoWayBindable(this.node)) return;
    const defaultName = getDefaultName(this.node, "HTMLElement");
    if (defaultName !== this.name) return;
    const eventName = this.event ?? defaultEventByName[this.name] ?? "readonly";
    if (event === "readonly" || event === "ro") return;
    this.node.addEventListener(eventName, () => {
      this.binding.updateStateValue(this.filteredValue);
    });

  }

  init() {
  }

  assignValue(value:any) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    // @ts-ignore
    this.node[this.name] = value;
  }
}

export const createBindingNodeProperty: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeProperty(binding, node, name, filterFns, event);
  }
