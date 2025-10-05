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
import { ILoopContext } from "../LoopContext/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { Constructor } from "../types";
import { IPropertyAccessor, IRenderer, IUpdater } from "../Updater/types";
import { IUserConfig } from "../WebComponents/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAccessorSymbol, GetByRefSymbol, SetByRefSymbol } from "./symbols";

export interface IDependentProps {
  [propName: string]: string[];
}

export interface IState {
  [propName: string]: any;
  $connectedCallback?(): Promise<void> | void;
  $disconnectedCallback?(): Promise<void> | void;
  $component?: any;
  $navigate?(to:string): void;
  $resolve?(pattern:string, indexes?: number[]): any;
  $getAll?(pattern:string, indexes?: number[]): any[];
  $trackDependency?(pattern:string): void;
}

export interface IReadonlyStateProxy extends IState {
  [GetByRefSymbol](ref: IStatePropertyRef): any;
  [GetAccessorSymbol]: IPropertyAccessor;
}

export interface IWritableStateProxy extends IState {
  [GetByRefSymbol](ref: IStatePropertyRef): any;
  [SetByRefSymbol](ref: IStatePropertyRef, value: any): void;
  [GetAccessorSymbol]: IPropertyAccessor;
  [ConnectedCallbackSymbol](): Promise<void>;
  [DisconnectedCallbackSymbol](): Promise<void>;
}

export type IStateProxy = IReadonlyStateProxy | IWritableStateProxy;

export interface IStructiveStaticState {
  $isStructive?: boolean; // Whether the state is structive or not
  $config?: IUserConfig; // The config of the component
  $listProperties?: string[]; // The list properties of the component
}

export type IStructiveState = Constructor<IState> & IStructiveStaticState;

export type IComponentEngineForStateClass = Pick<IComponentEngine, 
  "pathManager" | "stateOutput" | "owner" 
>;

export interface IReadonlyStateHandler {
  engine      : IComponentEngineForStateClass;
  accessor    : IPropertyAccessor;
  refStack    : (IStatePropertyRef | null)[];
  refIndex    : number;
  lastRefStack: IStatePropertyRef | null;
  get(target  : Object, prop: PropertyKey, receiver: IReadonlyStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IReadonlyStateProxy): boolean;
}

export interface IWritableStateHandler {
  engine      : IComponentEngineForStateClass;
  accessor    : IPropertyAccessor;
  refStack    : (IStatePropertyRef | null)[];
  refIndex    : number;
  lastRefStack: IStatePropertyRef | null;
  loopContext : ILoopContext | null;
  get(target  : Object, prop: PropertyKey, receiver: IWritableStateProxy): any;
  set(target  : Object, prop: PropertyKey, value: any, receiver: IWritableStateProxy): boolean;
}

export type IStateHandler = IReadonlyStateHandler | IWritableStateHandler;