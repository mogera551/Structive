import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { raiseError } from "../../utils.js";
import { createBindContent } from "../BindContent.js";
import { IBindContent, IBinding } from "../types";
import { BindingNodeBlock } from "./BindingNodeBlock.js";
import { CreateBindingNodeFn } from "./types";

class BindingNodeIf extends BindingNodeBlock {
  #bindContent: IBindContent;
  #trueBindContents: Set<IBindContent>;
  #falseBindContents: Set<IBindContent> = new Set();
  #bindContents: Set<IBindContent>;

  get bindContents(): Set<IBindContent> {
    return this.#bindContents;
  }

  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);
    this.#bindContent = createBindContent(
      this.binding, 
      this.id, 
      this.binding.engine, 
      "", 
      null
    );
    this.#trueBindContents = this.#bindContents = new Set([this.#bindContent]);
  }

  assignValue(value:any) {
    if (typeof value !== "boolean") {
      raiseError(`BindingNodeIf.update: value is not boolean`);
    }
    const parentNode = this.node.parentNode;
    if (parentNode == null) {
      raiseError(`BindingNodeIf.update: parentNode is null`);
    }
    if (value) {
      this.#bindContent.render();
      this.#bindContent.mountBefore(parentNode, this.node.nextSibling);
      this.#bindContents = this.#trueBindContents;
    } else {
      this.#bindContent.unmount();
      this.#bindContents = this.#falseBindContents;
    }
  }
}

export const createBindingNodeIf: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, decorates);
  }
