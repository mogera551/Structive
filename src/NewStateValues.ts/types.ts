import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { primitive } from "../types";

export interface IStateValueEntry {
  version: number;
  info: IStructuredPathInfo;
  get listIndex(): IListIndex | null;
  getValue(version: number): any;
  setValue(version: number, value: any): void;
}

export interface IStateValueManager {
  getValue(version:number, info: IStructuredPathInfo, listIndex: IListIndex | null): any;
  setValue(version:number, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;
  build(version:number, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;

}

export interface IStateProxyHandlerForRebuild {
  
}

