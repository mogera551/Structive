import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IState, IStateProxy, IStructiveState } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IUpdater } from "../Updater/types";
import { ComponentType, IComponentConfig, StructiveComponent } from "../WebComponents/types";

export interface IComponentEngine {
  type          : ComponentType;
  config        : IComponentConfig;
  template      : HTMLTemplateElement;
  styleSheet    : CSSStyleSheet;
  stateClass    : IStructiveState;
  state         : IState;
  stateProxy    : IStateProxy;
  updater       : IUpdater;
  inputFilters  : FilterWithOptions;
  outputFilters : FilterWithOptions;
  bindContent   : IBindContent;
  baseClass     : typeof HTMLElement;
  owner         : StructiveComponent;
  trackedGetters: Set<string>;

  getContextListIndex(patternName: string): IListIndex | null;               // パターン名からリストインデックスを取得する(ワイルドカード探索用)
  getLoopContexts():ILoopContext[];               // ループコンテキストを取得する
  getLastStatePropertyRef(): {info:IStructuredPathInfo, listIndex:IListIndex | null} | null; // 最後に取得したプロパティ参照を取得する

  listInfoSet        : Set<IStructuredPathInfo>; // プロパティ名パターンのユニークな一覧のうち、配列を持つもの
  elementInfoSet     : Set<IStructuredPathInfo>; // プロパティ名パターンのユニークな一覧のうち、配列の要素を持つもの
  bindingsByListIndex: WeakMap<IListIndex, Set<IBinding>>; // リストインデックスからバインディングを取得する
  dependentTree      : Map<IStructuredPathInfo, Set<IStructuredPathInfo>>; // 依存関係の木を取得する

  bindingsByComponent: WeakMap<StructiveComponent, Set<IBinding>>; // コンポーネントからバインディングを取得する

  setLoopContext(loopContext: ILoopContext, callback: ()=>Promise<void>): Promise<void>;
  asyncSetStatePropertyRef(
    info: IStructuredPathInfo, 
    listIndex  : IListIndex | null, 
    callback: ()=>Promise<any>
  ): Promise<any>;
  setStatePropertyRef(info:IStructuredPathInfo, listIndex:IListIndex | null, callback: ()=>any): any;

  connectedCallback(): Promise<void>;
  disconnectedCallback(): Promise<void>;

  saveBinding(pattern:IStructuredPathInfo, listIndex:IListIndex | null, binding: IBinding): void;
  saveListIndexesSet(pattern:IStructuredPathInfo, listIndex:IListIndex | null, saveListIndexesSet:Set<IListIndex>): void;
  saveList(pattern:IStructuredPathInfo, listIndex:IListIndex | null, list:any[]): void;
  getBindings(pattern:IStructuredPathInfo, listIndex:IListIndex | null): IBinding[];
  getListIndexesSet(pattern:IStructuredPathInfo, listIndex:IListIndex | null): Set<IListIndex> | null;
  getList(pattern:IStructuredPathInfo, listIndex:IListIndex | null): any[] | null;
  addDependentProp(pattern:IStructuredPathInfo, dependentPattern:IStructuredPathInfo): void;

  getPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null): any; // プロパティの値を取得する
  setPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null, value: any): void; // プロパティの値を設定する
}

export interface ISaveInfoByResolvedPathInfo {
  list          : any[] | null;
  listIndexesSet: Set<IListIndex> | null;
  bindings      : IBinding[];
}