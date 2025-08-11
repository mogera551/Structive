import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { Constructor } from "../types";
import { IUserConfig } from "../WebComponents/types";

export interface IState {
  [key: string]: any;
  $connectedCallback?(): Promise<void>;
  $disconnectedCallback?(): Promise<void>;
}

export interface IStateExtended extends IState {
  $1: number | undefined;
  $2: number | undefined;
  $3: number | undefined;
  $4: number | undefined;
  $5: number | undefined;
  $6: number | undefined;
  $7: number | undefined;
  $8: number | undefined;
  $9: number | undefined;
  $10: number | undefined;
  $11: number | undefined;
  $12: number | undefined;
  $13: number | undefined;
  $14: number | undefined;
  $15: number | undefined;
  $16: number | undefined;
  $root: HTMLElement;
  $getAll(pattern:string, indexes?: number[]): any[];
  $trackDependency(pattern:string): void;
}

export interface IContextEntry {
  pattern: string;
  info: IStructuredPathInfo;
  wildcardPath: string;
  listIndex: IListIndex | null;
}

export interface IStateStatic {
  $config?: IUserConfig; // The config of the component
}

export type StateClass = Constructor<IState> & IStateStatic;

export type IStateProxyHandler = ProxyHandler<IStateExtended>;
