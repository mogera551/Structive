import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { IStateProxy } from "../../StateClass/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IBinding } from "../types";

export interface IBindingState {
  readonly pattern      : string | never;
  readonly info         : IStructuredPathInfo | never;
  readonly listIndex    : IListIndex | null;
  readonly state        : IStateProxy;
  readonly filters      : Filters;
  readonly value        : any;
  readonly filteredValue: any;
  init(): void;
}
export type CreateBindingStateByStateFn = (binding:IBinding, state: IStateProxy, filters: FilterWithOptions) => IBindingState;
export type CreateBindingStateFn = (name: string, filterTexts: IFilterText[]) => CreateBindingStateByStateFn;