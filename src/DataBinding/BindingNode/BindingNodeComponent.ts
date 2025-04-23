import { createFilters } from "../../BindingBuilder/createFilters";
import { IFilterText } from "../../BindingBuilder/types";
import { RenderSymbol } from "../../ComponentState/symbols";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { StructiveComponent } from "../../WebComponents/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode";
import { CreateBindingNodeFn } from "./types";

class BindingNodeComponent extends BindingNode {
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

  init(): void {
    const engine = this.binding.engine;
    let bindings = engine.bindingsByComponent.get(this.node as StructiveComponent);
    if (typeof bindings === "undefined") {
      bindings = new Set<IBinding>();
      engine.bindingsByComponent.set(this.node as StructiveComponent, bindings);
    }
    bindings.add(this.binding);
  }

  assignValue(value: any): void {
    const component = this.node as StructiveComponent;
    component.state[RenderSymbol](this.subName, value);
  }

}

export const createBindingNodeComponent: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, event);
  }
