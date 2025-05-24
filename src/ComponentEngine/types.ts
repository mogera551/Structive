import { IBindContent, IBinding } from "../DataBinding/types";
import { DependencyType, IDependencyEdge } from "../DependencyWalker/types";
import { FilterWithOptions } from "../Filter/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IState, IStateProxy, IStructiveState, IWritableStateProxy } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IUpdater } from "../Updater/types";
import { ComponentType, IComponentConfig, StructiveComponent } from "../WebComponents/types";

/**
 * IComponentEngineインターフェースは、Structiveコンポーネントエンジンの主要な機能・状態・依存関係・
 * バインディング管理などを定義するための型です。
 *
 * 主な役割・設計ポイント:
 * - コンポーネントの状態・テンプレート・スタイル・フィルター・バインディングなどの管理
 * - 依存関係グラフやリスト構造の管理
 * - バインディングやリスト情報の保存・取得・存在判定
 * - Web Componentsのライフサイクル（connectedCallback/disconnectedCallback）対応
 * - 状態プロパティの取得・設定、プロキシ生成
 * - 各種キャッシュやマップを活用した効率的な管理
 *
 * Structiveのリアクティブな状態管理・バインディング・依存解決の基盤となるインターフェースです。
 */
export interface IComponentEngine {
  type          : ComponentType;
  config        : IComponentConfig;
  template      : HTMLTemplateElement;
  styleSheet    : CSSStyleSheet;
  stateClass    : IStructiveState;
  state         : IState;
  readonlyState : IStateProxy;
  updater       : IUpdater;
  inputFilters  : FilterWithOptions;
  outputFilters : FilterWithOptions;
  bindContent   : IBindContent;
  baseClass     : typeof HTMLElement;
  owner         : StructiveComponent;
  trackedGetters: Set<string>;

  listInfoSet        : Set<IStructuredPathInfo>; // プロパティ名パターンのユニークな一覧のうち、配列を持つもの
  elementInfoSet     : Set<IStructuredPathInfo>; // プロパティ名パターンのユニークな一覧のうち、配列の要素を持つもの
  bindingsByListIndex: WeakMap<IListIndex, Set<IBinding>>; // リストインデックスからバインディングを取得する
  dependentTree      : Map<IStructuredPathInfo, Set<IDependencyEdge>>; // 依存関係の木を取得する

  bindingsByComponent: WeakMap<StructiveComponent, Set<IBinding>>; // コンポーネントからバインディングを取得する

  connectedCallback(): Promise<void>;
  disconnectedCallback(): Promise<void>;

  saveBinding(pattern:IStructuredPathInfo, listIndex:IListIndex | null, binding: IBinding): void;
  saveListIndexesSet(pattern:IStructuredPathInfo, listIndex:IListIndex | null, saveListIndexesSet:Set<IListIndex>): void;
  saveList(pattern:IStructuredPathInfo, listIndex:IListIndex | null, list:any[]): void;
  getBindings(pattern:IStructuredPathInfo, listIndex:IListIndex | null): IBinding[];
  existsBindingsByInfo(info: IStructuredPathInfo): boolean;
  getListIndexesSet(pattern:IStructuredPathInfo, listIndex:IListIndex | null): Set<IListIndex> | null;
  getList(pattern:IStructuredPathInfo, listIndex:IListIndex | null): any[] | null;
  addDependentProp(pattern:IStructuredPathInfo, dependentPattern:IStructuredPathInfo, type:DependencyType): void;

  getPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null): any; // プロパティの値を取得する
  setPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null, value: any): void; // プロパティの値を設定する
  createReadonlyStateProxy(): IStateProxy; // 読み取り専用の状態プロキシを作成する
  useWritableStateProxy(
    loopContext: ILoopContext | null,
    callback: (stateProxy: IWritableStateProxy) => Promise<void>
  ): Promise<void>;
}

/**
 * パス解決済みのバインディング情報をまとめて管理する型
 */
export interface ISaveInfoByResolvedPathInfo {
  list          : any[] | null;
  listIndexesSet: Set<IListIndex> | null;
  bindings      : IBinding[];
}