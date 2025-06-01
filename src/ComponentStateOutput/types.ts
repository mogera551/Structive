import { IStructuredPathInfo } from "../StateProperty/types";

export interface IComponentStateOutput {
  get(pathInfo: IStructuredPathInfo): any;
  set(pathInfo: IStructuredPathInfo, value: any): void;
  startsWith(pathInfo: IStructuredPathInfo): boolean;
}

