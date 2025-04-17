import { createBindingState } from "../DataBinding/BindingState/BindingState";
import { createBindingStateIndex } from "../DataBinding/BindingState/BindingStateIndex";
import { CreateBindingStateByStateFn } from "../DataBinding/BindingState/types";
import { IFilterText } from "./types";

const ereg = new RegExp(/^\$\d+$/);

export function getBindingStateCreator(
  name       : string, 
  filterTexts: IFilterText[]
): CreateBindingStateByStateFn {
  if (ereg.test(name)) {
    return createBindingStateIndex(name, filterTexts);
  } else {
    return createBindingState(name, filterTexts);
  }
}