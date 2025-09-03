import { IListIndex2 } from "../ListIndex2/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IComponentStateOutput {
  get(pathInfo: IStructuredPathInfo, listIndex: IListIndex2 | null): any;
  set(pathInfo: IStructuredPathInfo, listIndex: IListIndex2 | null, value: any): boolean;
  startsWith(pathInfo: IStructuredPathInfo): boolean;
  getListIndexesSet(pathInfo: IStructuredPathInfo, listIndex: IListIndex2 | null): Set<IListIndex2> | null;
}

