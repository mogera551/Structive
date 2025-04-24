import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { IBindContent, IBinding } from "../types";

export interface IBindingNode {
  readonly node           : Node;
  readonly name           : string;
  readonly subName        : string;
  readonly event          : string | null;
  readonly binding        : IBinding;
  readonly filters        : Filters;
  readonly isSelectElement: boolean;
  readonly bindContents   : Set<IBindContent>;
  readonly value        : any;
  readonly filteredValue: any;
  update(): void;
  init(): void;
  assignValue(value: any): void;
  updateElements(listIndexes: IListIndex[], values: any[]): void;
}

export type CreateBindingNodeByNodeFn = 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => IBindingNode;
export type CreateBindingNodeFn = 
  (name: string, filterTexts: IFilterText[], event: string | null) => CreateBindingNodeByNodeFn;
