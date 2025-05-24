/**
 * types.ts
 *
 * StateClass関連の型定義ファイルです。
 *
 * 主な役割:
 * - StateClassやそのプロキシ、ハンドラ、依存プロパティなどのインターフェースを定義
 * - IState/IReadonlyStateProxy: StateオブジェクトおよびProxyの型（各種APIシンボルによる拡張含む）
 * - IStateHandler/IReadonlyStateHandler/IWritableStateHandler: 状態管理やAPI呼び出し、スコープ管理を担うハンドラの型
 * - IStructiveStaticState/IStructiveState: 静的プロパティやコンストラクタ型の定義
 * - IDependentProps: 依存プロパティ情報の型
 *
 * 設計ポイント:
 * - ProxyトラップやAPI呼び出しを型安全に扱うための設計
 * - 依存解決、キャッシュ、ループ・プロパティ参照スコープ管理など多機能な状態管理に対応
 * - StateClassの拡張やテスト、型安全な利用を支える基盤
 */
import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { Constructor, IUserConfig } from "../WebComponents/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol, SetCacheableSymbol } from "./symbols";

export interface IDependentProps {
  [propName: string]: string[];
}

export interface IState {
  [propName: string]: any;
  $connectedCallback?(): Promise<void> | void;
  $disconnectedCallback?(): Promise<void> | void;
  $dependentProps?: IDependentProps;
  $component?: any;
  $navigate?(to:string): void;
}

export interface IReadonlyStateProxy extends IState {
  [GetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null): any;
  [SetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;
  [SetCacheableSymbol](callback: () => void): void;
  [ConnectedCallbackSymbol](): Promise<void>;
  [DisconnectedCallbackSymbol](): Promise<void>;
}

export interface IWritableStateProxy extends IState {
  [GetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null): any;
  [SetByRefSymbol](pattern: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void;
  [ConnectedCallbackSymbol](): Promise<void>;
  [DisconnectedCallbackSymbol](): Promise<void>;
}

export interface IStructiveStaticState {
  $isStructive?: boolean; // Whether the state is structive or not
  $config?: IUserConfig; // The config of the component
}

export type IStructiveState = Constructor<IState> & IStructiveStaticState;

export interface IReadonlyStateHandler {
  engine           : IComponentEngine;
  cacheable        : boolean;
  cache            : {[key:string]:any};
  lastTrackingStack: IStructuredPathInfo | null;
  trackingStack    : IStructuredPathInfo[];
  structuredPathInfoStack: IStructuredPathInfo[];
  listIndexStack: (IListIndex | null)[];
  loopContext: ILoopContext | null;
  get(target  : Object, prop: PropertyKey, receiver: IReadonlyStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IReadonlyStateProxy): boolean;
}

export interface IWritableStateHandler {
  engine           : IComponentEngine;
  cacheable        : boolean;
  cache            : {[key:string]:any};
  lastTrackingStack: IStructuredPathInfo | null;
  trackingStack    : IStructuredPathInfo[];
  structuredPathInfoStack: IStructuredPathInfo[];
  listIndexStack: (IListIndex | null)[];
  loopContext: ILoopContext | null;
  get(target  : Object, prop: PropertyKey, receiver: IReadonlyStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IReadonlyStateProxy): boolean;
}

export type IStateHandler = IReadonlyStateHandler | IWritableStateHandler;