import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, ResolveSymbol, SetByRefSymbol, SetCacheableSymbol } from "./symbols";

export interface IDependentProps {
  [propName: string]: string[];
}

export interface IState {
  [propName: string]: any;
  $connectedCallback?(): Promise<void> | void;
  $disconnectedCallback?(): Promise<void> | void;
  $dependentProps?: IDependentProps;
  $component?: any;
}

export interface IStateProxy extends IState {
  [GetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null): any;
  [SetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;
  [SetCacheableSymbol](callback: () => Promise<void>): Promise<void>;
  [ConnectedCallbackSymbol](): Promise<void>;
  [DisconnectedCallbackSymbol](): Promise<void>;
  [ResolveSymbol](path: string, indexes: number[]): any
}