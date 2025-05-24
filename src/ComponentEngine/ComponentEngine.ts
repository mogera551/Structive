import { createBindContent } from "../DataBinding/BindContent.js";
import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IState, IStateProxy, IStructiveState } from "../StateClass/types";
import { IUpdater } from "../Updater/types";
import { createUpdater } from "../Updater/updater.js";
import { ComponentType, IComponentConfig, IComponentStatic, StructiveComponent } from "../WebComponents/types";
import { attachShadow } from "./attachShadow.js";
import { ISaveInfoByResolvedPathInfo, IComponentEngine } from "./types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { buildListIndexTree } from "../StateClass/buildListIndexTree.js";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols.js";
import { ILoopContext } from "../LoopContext/types";
import { IListIndex } from "../ListIndex/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { BindParentComponentSymbol } from "../ComponentState/symbols.js";
import { raiseError } from "../utils.js";
import { DependencyType, IDependencyEdge } from "../DependencyWalker/types.js";
import { createDependencyEdge } from "../DependencyWalker/createDependencyEdge.js";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy.js";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy.js";

/**
 * ComponentEngineクラスは、Structiveコンポーネントの状態管理・依存関係管理・
 * バインディング・ライフサイクル・レンダリングなどの中核的な処理を担うエンジンです。
 *
 * 主な役割:
 * - 状態インスタンスやプロキシの生成・管理
 * - テンプレート・スタイルシート・フィルター・バインディング情報の管理
 * - 依存関係グラフ（dependentTree）の構築と管理
 * - バインディング情報やリスト情報の保存・取得
 * - ライフサイクル（connectedCallback/disconnectedCallback）処理
 * - Shadow DOMやスタイルシートの適用
 * - 状態プロパティの取得・設定
 * - バインディングの追加・存在判定・リスト管理
 *
 * 構造・設計上の特徴:
 * - 状態や依存関係、バインディング情報を効率的に管理するためのキャッシュやマップを多用
 * - テンプレートやリスト構造の多重管理に対応
 * - 非同期初期化やUpdaterによるバッチ的な状態更新設計
 * - 疎結合な設計で、各種ユーティリティやファクトリ関数と連携
 *
 * 典型的なWeb Componentsのライフサイクルやリアクティブな状態管理を、Structive独自の構造で実現しています。
 */
export class ComponentEngine implements IComponentEngine {
  type          : ComponentType = 'autonomous';
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
  baseClass     : typeof HTMLElement = HTMLElement;
  owner         : StructiveComponent;
  trackedGetters: Set<string>;

  listInfoSet         : Set<IStructuredPathInfo> = new Set();
  elementInfoSet      : Set<IStructuredPathInfo> = new Set();
  bindingsByListIndex : WeakMap<IListIndex, Set<IBinding>> = new WeakMap();
  dependentTree       : Map<IStructuredPathInfo, Set<IDependencyEdge>> = new Map();

  bindingsByComponent: WeakMap<StructiveComponent, Set<IBinding>> = new WeakMap();

  #waitForInitialize : PromiseWithResolvers<void> = Promise.withResolvers<void>();

  constructor(config: IComponentConfig, owner: StructiveComponent) {
    this.config = config;
    if (this.config.extends) {
      this.type = 'builtin';
    }
    const componentClass = owner.constructor as IComponentStatic;
    this.template = componentClass.template;
    this.styleSheet = componentClass.styleSheet;
    this.stateClass = componentClass.stateClass;
    this.state = new this.stateClass();
    this.readonlyState = createReadonlyStateProxy(this, this.state);
    this.updater = createUpdater(this);
    this.inputFilters = componentClass.inputFilters;
    this.outputFilters = componentClass.outputFilters;
    this.owner = owner;
    this.trackedGetters = componentClass.trackedGetters;
    // 依存関係の木を作成する
    const checkDependentProp = (info: IStructuredPathInfo) => {
      const parentInfo = info.parentInfo;
      if (parentInfo === null) return;
      this.addDependentProp(info, parentInfo, "structured");
      checkDependentProp(parentInfo);
    }
    for(const path of componentClass.paths) {
      const info = getStructuredPathInfo(path);
      checkDependentProp(info);
    }
    // 配列のプロパティ、配列要素のプロパティを登録する
    for(const listPath of componentClass.listPaths) {
      this.listInfoSet.add(getStructuredPathInfo(listPath));
      this.elementInfoSet.add(getStructuredPathInfo(listPath + ".*"));
    }
    this.bindContent = createBindContent(null, componentClass.id, this, null, null); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
    for(const info of this.listInfoSet) {
      if (info.wildcardCount > 0) continue;
      const value = this.readonlyState[GetByRefSymbol](info, null)
      buildListIndexTree(this, info, null, value);
    }
  }

  async connectedCallback(): Promise<void> {
    if (this.owner.dataset.state) {
      try {
        const json = JSON.parse(this.owner.dataset.state);
        await this.useWritableStateProxy(null, async (stateProxy) => {
          // JSONから状態を設定する
          for(const [key, value] of Object.entries(json)) {
            const info = getStructuredPathInfo(key);
            if (info.wildcardCount > 0) continue;
            stateProxy[SetByRefSymbol](info, null, value);
          }
        });
      } catch(e) {
        raiseError("Failed to parse state from dataset");
      }
    }
    this.owner.state[BindParentComponentSymbol]();
    attachShadow(this.owner, this.config, this.styleSheet);
    await this.readonlyState[ConnectedCallbackSymbol]();
    this.readonlyState[SetCacheableSymbol](() => {
      this.bindContent.render();
    });
    this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
    this.#waitForInitialize.resolve();
  }

  async disconnectedCallback(): Promise<void> {
    await this.readonlyState[DisconnectedCallbackSymbol]();
  }

  #saveInfoByListIndexByResolvedPathInfoId: { [id:number]: WeakMap<IListIndex,ISaveInfoByResolvedPathInfo> } = {};
  #saveInfoByStructuredPathId: { [id:number]: ISaveInfoByResolvedPathInfo } = {};

  createSaveInfo():ISaveInfoByResolvedPathInfo {
    return {
      list          : null,
      listIndexesSet: null,
      bindings      : [],
    }
  }

  getSaveInfoByStatePropertyRef(info:IStructuredPathInfo, listIndex:IListIndex | null): ISaveInfoByResolvedPathInfo {
    if (listIndex === null) {
      let saveInfo = this.#saveInfoByStructuredPathId[info.id];
      if (typeof saveInfo === "undefined") {
        saveInfo = this.createSaveInfo();
        this.#saveInfoByStructuredPathId[info.id] = saveInfo;
      }
      return saveInfo;
    } else {
      let saveInfoByListIndex = this.#saveInfoByListIndexByResolvedPathInfoId[info.id];
      if (typeof saveInfoByListIndex === "undefined") {
        saveInfoByListIndex = new WeakMap<IListIndex, ISaveInfoByResolvedPathInfo>();
        this.#saveInfoByListIndexByResolvedPathInfoId[info.id] = saveInfoByListIndex;
      }
      let saveInfo = saveInfoByListIndex.get(listIndex);
      if (typeof saveInfo === "undefined") {
        saveInfo = this.createSaveInfo();
        saveInfoByListIndex.set(listIndex, saveInfo);
      }
      return saveInfo;
    }
  }
  
  saveBinding(
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    binding  : IBinding
  ): void {
    const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
    saveInfo.bindings.push(binding);
  }

  saveListIndexesSet(
    info              :IStructuredPathInfo, 
    listIndex         :IListIndex | null, 
    saveListIndexesSet:Set<IListIndex>
  ): void {
    const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
    saveInfo.listIndexesSet = saveListIndexesSet;
  }

  saveList(
    info     :IStructuredPathInfo, 
    listIndex:IListIndex | null, 
    list     :any[]
  ): void {
    const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
    saveInfo.list = list;
  }

  getBindings(
    info     :IStructuredPathInfo, 
    listIndex:IListIndex | null
  ): IBinding[] {
    const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
    return saveInfo.bindings;
  }

  existsBindingsByInfo(info: IStructuredPathInfo): boolean {
    if (typeof this.#saveInfoByStructuredPathId[info.id] !== "undefined") {
      return true;
    }
    if (typeof this.#saveInfoByListIndexByResolvedPathInfoId[info.id] !== "undefined") {
      return true;
    }
    return false;
  }

  getListIndexesSet(info:IStructuredPathInfo, listIndex:IListIndex | null): Set<IListIndex> | null {
    const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
    return saveInfo.listIndexesSet;
  }
    
  getList(
    info     :IStructuredPathInfo, 
    listIndex:IListIndex | null
  ): any[] | null {
    const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
    return saveInfo.list;
  }

  addDependentProp(info: IStructuredPathInfo, refInfo: IStructuredPathInfo, type: DependencyType) {
    let dependents = this.dependentTree.get(refInfo);
    if (typeof dependents === "undefined") {
      dependents = new Set<IDependencyEdge>();
      this.dependentTree.set(refInfo, dependents);
    }
    const edge = createDependencyEdge(info, type);
    dependents.add(edge);
  }

  getPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null): any {
    // プロパティの値を取得する
    const readonlyState = createReadonlyStateProxy(this, this.state);
    return readonlyState[GetByRefSymbol](info, listIndex);
  }
  setPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null, value: any): void {
    // プロパティの値を設定する
    this.updater.addProcess(() => {
      this.useWritableStateProxy(null, async (stateProxy) => {
        stateProxy[SetByRefSymbol](info, listIndex, value);
      });
    });
  }
  // 読み取り専用の状態プロキシを作成する
  createReadonlyStateProxy(): IStateProxy {
    return createReadonlyStateProxy(this, this.state);
  }
  // 書き込み可能な状態プロキシを作成する
  async useWritableStateProxy(
    loopContext: ILoopContext | null,
    callback: (stateProxy: IStateProxy) => Promise<void>
  ): Promise<void> {
    return useWritableStateProxy(this, this.state, loopContext, callback);
  }
}

export function createComponentEngine(config: IComponentConfig, component: StructiveComponent): IComponentEngine {
  return new ComponentEngine(config, component);
}