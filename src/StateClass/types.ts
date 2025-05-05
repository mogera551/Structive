import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { Router } from "../Router/Router";
import { IStructuredPathInfo } from "../StateProperty/types";
import { Constructor, IComponentConfig, IUserConfig } from "../WebComponents/types";
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
  $router?: Router;
}

export interface IStateProxy extends IState {
  [GetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null): any;
  [SetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;
  [SetCacheableSymbol](callback: () => Promise<void>): Promise<void>;
  [ConnectedCallbackSymbol](): Promise<void>;
  [DisconnectedCallbackSymbol](): Promise<void>;
  [ResolveSymbol](path: string, indexes: number[]): any
}

export interface IStructiveStaticState {
  $isStructive?: boolean; // Whether the state is structive or not
  $config?: IUserConfig; // The config of the component
}

export type IStructiveState = Constructor<IState> & IStructiveStaticState;

export interface IStateHandler {
  engine           : IComponentEngine;
  cacheable        : boolean;
  cache            : {[key:number]:any};
  lastTrackingStack: IStructuredPathInfo | null;
  trackingStack    : IStructuredPathInfo[];
  callableApi      : { [key:symbol]: Function };
  get(target  : Object, prop: PropertyKey, receiver: IStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IStateProxy): boolean;

}
