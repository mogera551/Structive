import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

class BindingNodeEvent extends BindingNode {
  #subName    : string;
  constructor(
    binding: IBinding, 
    node   : Node, 
    name   : string,
    filters: Filters,
    event  : string | null
  ) {
    super(binding, node, name, filters, event);
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
    const bindingState = this.binding.bindingState;
    const engine = this.binding.engine;
    const stateProxy = engine.stateProxy;
    const updater = engine.updater;
    const loopContext = this.binding.parentBindContent.currentLoopContext;
    const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
    const option = this.event;
    if (option === "preventDefault") {
      e.preventDefault();
    }
    this.binding.engine.updater.addProcess(async () => {
      const value = bindingState.value;
      const typeOfValue = typeof value;
      updater.addProcess(async () => {
        if (loopContext) {
          await engine.setLoopContext(loopContext, async () => {
            if (typeOfValue === "function") {
              await Reflect.apply(value, stateProxy, [e, ...indexes]);
            } else {
              // ToDo:error
            }
          });
        } else {
          if (typeOfValue === "function") {
            await Reflect.apply(value, stateProxy, [e, ...indexes]);
          } else {
            // ToDo:error
          }
        }
      });
    });
  } 
}

export const createBindingNodeEvent: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], event: string | null) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, event);
  }
