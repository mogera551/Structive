import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { SetLoopContextSymbol } from "../../StateClass/symbols.js";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

class BindingNodeEvent extends BindingNode {
  #subName    : string;
  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);
    this.#subName = this.name.slice(2); // on～
    const element = node as HTMLElement;
    element.addEventListener(this.subName, (e:Event) => this.handler(e));
  }
  get subName(): string {
    return this.#subName;
  }
  update() {
    // 何もしない
  }

  handler(e: Event) {
    const engine = this.binding.engine;
    const loopContext = this.binding.parentBindContent.currentLoopContext;
    const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
    const options = this.decorates;
    const value = this.binding.bindingState.value;
    const typeOfValue = typeof value;
    if (typeOfValue !== "function") {
      raiseError(`BindingNodeEvent: ${this.name} is not a function.`);
    }
    if (options.includes("preventDefault")) {
      e.preventDefault();
    }
    if (options.includes("stopPropagation")) {
      e.stopPropagation();
    }
    this.binding.engine.updater.addProcess(async () => {
      const stateProxy = engine.createWritableStateProxy();
      await stateProxy[SetLoopContextSymbol](loopContext, async () => {
        await Reflect.apply(value, stateProxy, [e, ...indexes]);
      });
    });
  } 
}

export const createBindingNodeEvent: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, decorates);
  }
