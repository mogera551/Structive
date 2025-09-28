import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface IComponentStateOutput {
  get(ref: IStatePropertyRef): any;
  set(ref: IStatePropertyRef, value: any): boolean;
  startsWith(pathInfo: IStructuredPathInfo): boolean;
  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null;
}

