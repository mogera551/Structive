import { createFilters } from "../../BindingBuilder/createFilters.js";
import { getDefaultName } from "../../BindingBuilder/getDefaultName.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { SetLoopContextSymbol } from "../../StateClass/symbols.js";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
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
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);

    const isElement = this.node instanceof HTMLElement;
    if (!isElement) return;
    if (!isTwoWayBindable(this.node)) return;
    const defaultName = getDefaultName(this.node, "HTMLElement");
    if (defaultName !== this.name) return;
    if (decorates.length > 1) raiseError(`BindingNodeProperty: ${this.name} has multiple decorators`);
    const event = (decorates[0]?.startsWith("on") ? decorates[0]?.slice(2) : decorates[0]) ?? null;
    const eventName = event ?? defaultEventByName[this.name] ?? "readonly";
    if (eventName === "readonly" || eventName === "ro") return;

    const engine = this.binding.engine;
    const loopContext = this.binding.parentBindContent.currentLoopContext;
    const value = this.filteredValue;
    this.node.addEventListener(eventName, async () => {
      engine.updater.addProcess(async () => {
        const stateProxy = engine.createWritableStateProxy();
        await stateProxy[SetLoopContextSymbol](loopContext, async () => {
          binding.updateStateValue(stateProxy, value);
        });
      });
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
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeProperty(binding, node, name, filterFns, decorates);
  }
