import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface IComponentStateOutput {
  get(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null): any;
  set(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null, value: any): boolean;
  startsWith(pathInfo: IStructuredPathInfo): boolean;
  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null;
}

