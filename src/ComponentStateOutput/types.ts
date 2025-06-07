import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IComponentStateOutput {
  get(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null): any;
  set(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;
  startsWith(pathInfo: IStructuredPathInfo): boolean;
  getListIndexesSet(pathInfo: IStructuredPathInfo, listIndex: IListIndex | null): Set<IListIndex> | null;
}

