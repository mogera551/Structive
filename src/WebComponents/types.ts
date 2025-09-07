/**
 * types.ts
 *
 * StructiveのWeb Components関連の型定義ファイルです。
 *
 * 主な役割:
 * - IComponent/IComponentStatic: Structiveコンポーネントのインスタンス・クラスのインターフェースを定義
 * - StructiveComponent/StructiveComponentClass: HTMLElementとStructive独自機能を組み合わせた型
 * - IConfig/IUserConfig/IComponentConfig: グローバル・ユーザー・コンポーネントごとの設定型
 * - IUserComponentData: シングルファイルコンポーネント（SFC）の構造データ型
 * - StructiveComponentClasses/SingleFileComponents/IImportMap: 複数コンポーネントやimportmap管理用の型
 *
 * 設計ポイント:
 * - Web Componentsの拡張性・型安全性を担保し、状態・テンプレート・スタイル・バインディング・フィルターなど多機能なStructive基盤を支える設計
 * - SFCやimportmapなど動的なコンポーネント管理にも対応
 */
import { FilterWithOptions } from "../Filter/types";
import { IStructiveState } from "../StateClass/types";
import { IBinding } from "../DataBinding/types";
import { IComponentStateInput } from "../ComponentStateInput/types";
import { Constructor } from "../types";
import { IPathManager } from "../PathManager/types";

export type ComponentType = 'autonomous' | 'builtin';

export interface IComponent {
  readonly parentStructiveComponent: StructiveComponent | null; // The parent component of the current component
  readonly state: IComponentStateInput;
  readonly isStructive: boolean; // Whether the component is structive or not
  readonly waitForInitialize: PromiseWithResolvers<void>;
  getBindingsFromChild(component:IComponent): Set<IBinding> | null; // Get the bindings by component
  registerChildComponent(component:StructiveComponent): void; // Register the child component
  unregisterChildComponent(component:StructiveComponent): void; // Unregister the child component
}

export interface IComponentStatic {
  new(instanceId: number, instanceName: string): IComponent;
  readonly id            : number;
  readonly template      : HTMLTemplateElement;
  readonly styleSheet    : CSSStyleSheet;
  readonly stateClass    : IStructiveState;
  readonly inputFilters  : FilterWithOptions;
  readonly outputFilters : FilterWithOptions;
  readonly pathManager   : IPathManager;
  html:string;
  css:string;
  define(tagName:string):void;
}

export type StructiveComponent = HTMLElement & IComponent;

export type StructiveComponentClass = Constructor<StructiveComponent> & IComponentStatic;

export interface IConfig {
  debug                : boolean;
  locale               : string; // The locale of the component, ex. "en-US", default is "en-US"
  enableShadowDom      : boolean; // Whether to use Shadow DOM or not
  enableMainWrapper    : boolean; // Whether to use the main wrapper or not
  enableRouter         : boolean; // Whether to use the router or not
  autoInsertMainWrapper: boolean; // Whether to automatically insert the main wrapper or not
  autoInit             : boolean; // Whether to automatically initialize the component or not
  mainTagName          : string; // The tag name of the main wrapper, default is "app-main"
  routerTagName        : string; // The tag name of the router, default is "view-router"
  layoutPath           : string; // The path to the layout file, default is "src/layout.html"
  autoLoadFromImportMap: boolean; // Whether to automatically load the component from the import map or not
  optimizeList         : boolean; // Whether to optimize the list or not
  optimizeListElements : boolean; // Whether to optimize the list elements or not
  optimizeAccessor     : boolean; // Whether to optimize the accessors or not
}

export interface IUserConfig {
  enableWebComponents? : boolean; // Whether to use Web Components or not
  enableShadowDom?     : boolean; // Whether to use Shadow DOM or not
  extends?             : string; // The tag name of the component to extend
}

export interface IComponentConfig {
  enableWebComponents : boolean; // Whether to use Web Components or not
  enableShadowDom     : boolean; // Whether to use Shadow DOM or not
  extends             : string | null; // The tag name of the component to extend
}

export interface IUserComponentData {
  text      : string; // The text content of the component file
  html      : string; // The HTML content of the component file
  css       : string;  // The CSS content of the component file
  stateClass: IStructiveState; // The class that will be used to create the state object
}

export type StructiveComponentClasses = Record<string, StructiveComponentClass>;

export type SingleFileComponents = Record<string, string>;

export interface IImportMap {
  imports? : Record<string, string>; // The import map of the component
  scopes? : Record<string, Record<string, string>>; // The scopes of the component
}