import { CreateBindingStateByStateFn } from "../DataBinding/BindingState/types";
import { IFilterText } from "./types";
export declare function getBindingStateCreator(name: string, filterTexts: IFilterText[]): CreateBindingStateByStateFn;
