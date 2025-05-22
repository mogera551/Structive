import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { Router } from "../Router/Router";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { Constructor, IComponentConfig, IUserConfig } from "../WebComponents/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, GetContextListIndexSymbol, GetLastStatePropertyRefSymbol, ResolveSymbol, SetByRefSymbol, SetCacheableSymbol, SetLoopContextSymbol, SetStatePropertyRefSymbol } from "./symbols";

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
  [SetCacheableSymbol](callback: () => void): void;
  [ConnectedCallbackSymbol](): Promise<void>;
  [DisconnectedCallbackSymbol](): Promise<void>;
  [ResolveSymbol](path: string, indexes: number[]): any;
  [SetLoopContextSymbol](loopContext: ILoopContext | null, callback: () => Promise<void>): Promise<void>;
  [SetStatePropertyRefSymbol](info: IStructuredPathInfo, listIndex: IListIndex | null, callback: () => void): void;
  [GetContextListIndexSymbol](structuredPath: string): IListIndex | null;
  [GetLastStatePropertyRefSymbol](): IStatePropertyRef | null
}

export interface IStructiveStaticState {
  $isStructive?: boolean; // Whether the state is structive or not
  $config?: IUserConfig; // The config of the component
}

export type IStructiveState = Constructor<IState> & IStructiveStaticState;

export interface IStateHandler {
  engine           : IComponentEngine;
  cacheable        : boolean;
  cache            : {[key:string]:any};
  lastTrackingStack: IStructuredPathInfo | null;
  trackingStack    : IStructuredPathInfo[];
  callableApi      : { [key:symbol]: Function };
  structuredPathInfoStack: IStructuredPathInfo[];
  listIndexStack: (IListIndex | null)[];
  loopContext: ILoopContext | null;
  get(target  : Object, prop: PropertyKey, receiver: IStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IStateProxy): boolean;
}

export interface IReadonlyStateHandler {
  engine           : IComponentEngine;
  cacheable        : boolean;
  cache            : {[key:string]:any};
  lastTrackingStack: IStructuredPathInfo | null;
  trackingStack    : IStructuredPathInfo[];
  callableApi      : { [key:symbol]: Function };
  structuredPathInfoStack: IStructuredPathInfo[];
  listIndexStack: (IListIndex | null)[];
  loopContext: ILoopContext | null;
  get(target  : Object, prop: PropertyKey, receiver: IStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IStateProxy): boolean;
}

export interface IWritableStateHandler {
  engine           : IComponentEngine;
  cacheable        : boolean;
  cache            : {[key:string]:any};
  lastTrackingStack: IStructuredPathInfo | null;
  trackingStack    : IStructuredPathInfo[];
  callableApi      : { [key:symbol]: Function };
  structuredPathInfoStack: (IStructuredPathInfo | null)[];
  listIndexStack: (IListIndex | null)[];
  loopContext: ILoopContext | null;
  get(target  : Object, prop: PropertyKey, receiver: IStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IStateProxy): boolean;
}
