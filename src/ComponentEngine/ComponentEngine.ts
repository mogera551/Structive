import { createBindContent } from "../DataBinding/BindContent.js";
import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IState, IReadonlyStateProxy, IStructiveState, IWritableStateProxy } from "../StateClass/types";
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
import { raiseError } from "../utils.js";
import { DependencyType, IDependencyEdge } from "../DependencyWalker/types.js";
import { createDependencyEdge } from "../DependencyWalker/createDependencyEdge.js";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy.js";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy.js";
import { IComponentStateBinding } from "../ComponentStateBinding/types.js";
import { createComponentStateBinding } from "../ComponentStateBinding/createComponentStateBinding.js";
import { createComponentStateInput } from "../ComponentStateInput/createComponentStateInput.js";
import { createComponentStateOutput } from "../ComponentStateOutput/createComponentStateOutput.js";
import { IComponentStateInput } from "../ComponentStateInput/types.js";
import { IComponentStateOutput } from "../ComponentStateOutput/types.js";
import { AssignStateSymbol } from "../ComponentStateInput/symbols.js";
import { registerStructiveComponent } from "../WebComponents/findStructiveParent.js";

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
  readonlyState : IReadonlyStateProxy;
  updater       : IUpdater;
  inputFilters  : FilterWithOptions;
  outputFilters : FilterWithOptions;
  #bindContent  :IBindContent | null = null;
  get bindContent(): IBindContent {
    if (this.#bindContent === null) {
      raiseError("bindContent is not initialized yet");
    }
    return this.#bindContent;
  }
  baseClass     : typeof HTMLElement = HTMLElement;
  owner         : StructiveComponent;
  trackedGetters: Set<string>;
  getters       : Set<string>;
  setters       : Set<string>;

  listInfoSet         : Set<IStructuredPathInfo> = new Set();
  elementInfoSet      : Set<IStructuredPathInfo> = new Set();
  bindingsByListIndex : WeakMap<IListIndex, Set<IBinding>> = new WeakMap();
  dependentTree       : Map<IStructuredPathInfo, Set<IDependencyEdge>> = new Map();

  bindingsByComponent: WeakMap<StructiveComponent, Set<IBinding>> = new WeakMap();
  structiveChildComponents: Set<StructiveComponent> = new Set();

  #waitForInitialize : PromiseWithResolvers<void> = Promise.withResolvers<void>();
  #waitForDisconnected: PromiseWithResolvers<void> | null = null;
  
  #stateBinding: IComponentStateBinding = createComponentStateBinding();
  stateInput: IComponentStateInput;
  stateOutput: IComponentStateOutput;
  #blockPlaceholder: Comment | null = null; // ブロックプレースホルダー
  #blockParentNode: Node | null = null; // ブロックプレースホルダーの親ノード
  #ignoreDissconnectedCallback: boolean = false; // disconnectedCallbackを無視するフラグ

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
    this.owner =  owner;
    this.trackedGetters = componentClass.trackedGetters;
    this.getters = componentClass.getters;
    this.setters = componentClass.setters;
    this.stateInput = createComponentStateInput(this, this.#stateBinding);
    this.stateOutput = createComponentStateOutput(this.#stateBinding);
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
    for(const listPath of this.stateClass.$listProperties ?? []) {
      this.listInfoSet.add(getStructuredPathInfo(listPath));
      this.elementInfoSet.add(getStructuredPathInfo(listPath + ".*"));
    }
  }

  setup(): void {
    const componentClass = this.owner.constructor as IComponentStatic;
    for(const info of this.listInfoSet) {
      if (info.wildcardCount > 0) continue;
      const value = this.readonlyState[GetByRefSymbol](info, null)
      buildListIndexTree(this, info, null, value);
    }
    this.#bindContent = createBindContent(null, componentClass.id, this, null, null); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
  }

  get waitForInitialize(): PromiseWithResolvers<void> {
    return this.#waitForInitialize;
  }

  async connectedCallback(): Promise<void> {
    await this.#waitForDisconnected?.promise; // disconnectedCallbackが呼ばれている場合は待つ
    await this.owner.parentStructiveComponent?.waitForInitialize.promise;
    // コンポーネントの状態を初期化する
    if (this.owner.dataset.state) {
      // data-state属性から状態を取得する
      try {
        const json = JSON.parse(this.owner.dataset.state);
        this.stateInput[AssignStateSymbol](json);
      } catch(e) {
        raiseError("Failed to parse state from dataset");
      }
    }
    const parentComponent = this.owner.parentStructiveComponent;
    if (parentComponent) {
      // 親コンポーネントの状態をバインドする
      parentComponent.registerChildComponent(this.owner);
      // 親コンポーネントの状態を子コンポーネントにバインドする
      this.#stateBinding.bind(parentComponent, this.owner);
    }
    if (this.config.enableWebComponents) {
      attachShadow(this.owner, this.config, this.styleSheet);
    } else {
      this.#blockParentNode = this.owner.parentNode;
      this.#blockPlaceholder = document.createComment("Structive block placeholder");
      try {
        this.#ignoreDissconnectedCallback = true; // disconnectedCallbackを無視するフラグを立てる
        this.owner.replaceWith(this.#blockPlaceholder); // disconnectCallbackが呼ばれてしまう
      } finally {
        this.#ignoreDissconnectedCallback = false;
      }
    }

    if (this.config.enableWebComponents) {
      // Shadow DOMにバインドコンテンツをマウントする
      this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
    } else {
      // ブロックプレースホルダーの親ノードにバインドコンテンツをマウントする
      const parentNode = this.#blockParentNode ?? raiseError("Block parent node is not set");
      this.bindContent.mountAfter(parentNode, this.#blockPlaceholder);
    }
    this.readonlyState[SetCacheableSymbol](() => {
      this.bindContent.render();
    }); // キャッシュ可能にする
    await this.useWritableStateProxy(null, async (stateProxy) => {
      await stateProxy[ConnectedCallbackSymbol]();
    });
    // レンダリングが終わってから実行する
    queueMicrotask(() => {
      this.#waitForInitialize.resolve();
    });
  }

  async disconnectedCallback(): Promise<void> {
    this.#waitForDisconnected = Promise.withResolvers<void>();
    try {
      if (this.#ignoreDissconnectedCallback) return; // disconnectedCallbackを無視するフラグが立っている場合は何もしない
      await this.useWritableStateProxy(null, async (stateProxy) => {
        await stateProxy[DisconnectedCallbackSymbol]();
      });
      // 親コンポーネントから登録を解除する
      this.owner.parentStructiveComponent?.unregisterChildComponent(this.owner);
      if (!this.config.enableWebComponents) {
        this.#blockPlaceholder?.remove();
        this.#blockPlaceholder = null;
        this.#blockParentNode = null;
      }
    } finally {
      this.#waitForDisconnected.resolve(); // disconnectedCallbackが呼ばれたことを通知   
    }
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
    if (this.stateOutput.startsWith(info)) {
      return this.stateOutput.getListIndexesSet(info, listIndex);
    }
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
    return this.readonlyState[GetByRefSymbol](info, listIndex);
  }
  setPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null, value: any): void {
    // プロパティの値を設定する
    this.updater.addProcess(() => {
      this.useWritableStateProxy(null, async (stateProxy) => {
        stateProxy[SetByRefSymbol](info, listIndex, value);
      });
    });
  }
  // 書き込み可能な状態プロキシを作成する
  async useWritableStateProxy(
    loopContext: ILoopContext | null,
    callback: (stateProxy: IWritableStateProxy) => Promise<void>
  ): Promise<void> {
    return useWritableStateProxy(this, this.state, loopContext, callback);
  }
  // Structive子コンポーネントを登録する
  registerChildComponent(component: StructiveComponent): void {
    this.structiveChildComponents.add(component);
  }
  unregisterChildComponent(component: StructiveComponent): void {
    this.structiveChildComponents.delete(component);
  }
  
}

export function createComponentEngine(config: IComponentConfig, component: StructiveComponent): IComponentEngine {
  return new ComponentEngine(config, component);
}