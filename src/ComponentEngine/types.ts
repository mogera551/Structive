import { IComponentStateInput } from "../ComponentStateInput/types";
import { IComponentStateOutput } from "../ComponentStateOutput/types";
import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IListIndex } from "../ListIndex/types";
import { IPathManager } from "../PathManager/types";
import { IState, IStructiveState } from "../StateClass/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
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
  inputFilters  : FilterWithOptions;
  outputFilters : FilterWithOptions;
  readonly bindContent   : IBindContent;
  readonly pathManager   : IPathManager;
  baseClass     : typeof HTMLElement;
  owner         : StructiveComponent;
  waitForInitialize: PromiseWithResolvers<void>;

  bindingsByListIndex: WeakMap<IListIndex, Set<IBinding>>; // リストインデックスからバインディングを取得する

  bindingsByComponent: WeakMap<StructiveComponent, Set<IBinding>>; // Structive子コンポーネントからバインディングを取得する
  structiveChildComponents: Set<StructiveComponent>; // Structive子コンポーネントのセット

  stateInput: IComponentStateInput;
  stateOutput: IComponentStateOutput;

  setup(): void;
  connectedCallback(): Promise<void>;
  disconnectedCallback(): Promise<void>;

  saveBinding(ref: IStatePropertyRef, binding: IBinding): void;
  saveListAndListIndexes(ref: IStatePropertyRef, list: any[] | null, listIndexes: IListIndex[] | null): void;
  getBindings(ref: IStatePropertyRef): IBinding[];
  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null;
  getListAndListIndexes(ref: IStatePropertyRef): [any[] | null, IListIndex[] | null, any[] | null];

  getPropertyValue(ref: IStatePropertyRef): any; // プロパティの値を取得する
  setPropertyValue(ref: IStatePropertyRef, value: any): void; // プロパティの値を設定する
  registerChildComponent(component: StructiveComponent): void; // Structiveコンポーネントを登録する
  unregisterChildComponent(component: StructiveComponent): void; // Structiveコンポーネントを登録解除する
}

/**
 * パス解決済みのバインディング情報をまとめて管理する型
 */
export interface ISaveInfoByResolvedPathInfo {
  list       : any[] | null;
  listIndexes: IListIndex[] | null;
  bindings   : IBinding[];
  listClone  : any[] | null;
}