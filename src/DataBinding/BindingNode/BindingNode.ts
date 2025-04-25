import { Filters } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { raiseError } from "../../utils.js";
import { IBindContent, IBinding } from "../types";
import { IBindingNode } from "./types";

export class BindingNode implements IBindingNode {
  #binding: IBinding;
  #node: Node;
  #name: string;
  #filters: Filters;
  #event: string | null;
  #bindContents: Set<IBindContent> = new Set<IBindContent>();
  get node(): Node {
    return this.#node;
  }
  get name(): string {
    return this.#name;
  }
  get subName(): string {
    return this.#name;
  }
  get binding(): IBinding {
    return this.#binding;
  }
  get event(): string | null {
    return this.#event;
  }
  get filters(): Filters {
    return this.#filters;
  }
  get bindContents(): Set<IBindContent> {
    return this.#bindContents;
  }
  constructor(
    binding: IBinding, 
    node  : Node, 
    name  : string,
    filters: Filters,
    event : string | null
  ) {
    this.#binding = binding;
    this.#node = node;
    this.#name = name;
    this.#filters = filters;
    this.#event = event;
  }
  init():void {
  }
  update(): void {
    this.assignValue(this.binding.bindingState.filteredValue);
  }
  assignValue(value: any): void {
    raiseError(`BindingNode: assignValue not implemented`);
  }
  updateElements(listIndexes: IListIndex[], values: any[]) {
    raiseError(`BindingNode: updateElements not implemented`);
  }
  get isSelectElement(): boolean {
    return this.node instanceof HTMLSelectElement;
  }
  get value():any {
    return null;
  }
  get filteredValue():any {
    return null;
  }
}