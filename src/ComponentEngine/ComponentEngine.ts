import { createBindContent } from "../DataBinding/BindContent.js";
import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IState, IStructiveState } from "../StateClass/types";
import { ComponentType, IComponentConfig, IComponentStatic, StructiveComponent } from "../WebComponents/types";
import { attachShadow } from "./attachShadow.js";
import { ISaveInfoByResolvedPathInfo, IComponentEngine } from "./types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols.js";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../utils.js";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy.js";
import { IComponentStateBinding } from "../ComponentStateBinding/types.js";
import { createComponentStateBinding } from "../ComponentStateBinding/createComponentStateBinding.js";
import { createComponentStateInput } from "../ComponentStateInput/createComponentStateInput.js";
import { createComponentStateOutput } from "../ComponentStateOutput/createComponentStateOutput.js";
import { IComponentStateInput } from "../ComponentStateInput/types.js";
import { IComponentStateOutput } from "../ComponentStateOutput/types.js";
import { AssignStateSymbol } from "../ComponentStateInput/symbols.js";
import { IListIndex } from "../ListIndex/types.js";
import { IPathManager } from "../PathManager/types.js";
import { update } from "../Updater/Updater.js";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef.js";
import { RESERVED_WORD_SET } from "../constants.js";
import { addPathNode } from "../PathTree/PathNode.js";
import { IStatePropertyRef } from "../StatePropertyRef/types.js";

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

  bindingsByListIndex : WeakMap<IListIndex, Set<IBinding>> = new WeakMap();

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
    this.inputFilters = componentClass.inputFilters;
    this.outputFilters = componentClass.outputFilters;
    this.owner =  owner;
    this.stateInput = createComponentStateInput(this, this.#stateBinding);
    this.stateOutput = createComponentStateOutput(this.#stateBinding);
  }

  get pathManager(): IPathManager {
    return (this.owner.constructor as IComponentStatic).pathManager;
  }

  setup(): void {
    for(const path in this.state) {
      if (RESERVED_WORD_SET.has(path) || this.pathManager.alls.has(path)) {
        continue;
      }
      this.pathManager.alls.add(path);
      addPathNode(this.pathManager.rootNode, path);
    }
    const componentClass = this.owner.constructor as IComponentStatic;
    const rootRef = getStatePropertyRef(getStructuredPathInfo(''), null);
    this.#bindContent = createBindContent(null, componentClass.id, this, rootRef); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
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

    await update(this, null, async (updater, stateProxy) => {
      // 状態の初期レンダリングを行う
      for(const path of this.pathManager.alls) {
        const info = getStructuredPathInfo(path);
        if (info.pathSegments.length !== 1) continue; // ルートプロパティのみ
        if (this.pathManager.funcs.has(path)) continue; // 関数は除外
        const ref = getStatePropertyRef(info, null);
        updater.enqueueRef(ref);
      }
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
      await update(this, null, async (updater, stateProxy) => {
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

  #saveInfoByStructuredPathId: { [id:number]: ISaveInfoByResolvedPathInfo } = {};
  #saveInfoByResolvedPathInfoIdByListIndex: WeakMap<IListIndex, { [id:number]: ISaveInfoByResolvedPathInfo }> = new WeakMap();
  #saveInfoByRef: WeakMap<IStatePropertyRef, ISaveInfoByResolvedPathInfo> = new WeakMap();

  createSaveInfo():ISaveInfoByResolvedPathInfo {
    return {
      list          : null,
      listIndexes   : null,
      bindings      : [],
    }
  }

  getSaveInfoByStatePropertyRef(ref: IStatePropertyRef): ISaveInfoByResolvedPathInfo {
    if (ref.listIndex === null) {
      let saveInfo = this.#saveInfoByStructuredPathId[ref.info.id];
      if (typeof saveInfo === "undefined") {
        saveInfo = this.createSaveInfo();
        this.#saveInfoByStructuredPathId[ref.info.id] = saveInfo;
      }
      return saveInfo;
    } else {
/*
      let saveInfo = this.#saveInfoByRef.get(ref);
      if (typeof saveInfo === "undefined") {
        saveInfo = this.createSaveInfo();
        this.#saveInfoByRef.set(ref, saveInfo);
      }
*/
      let saveInfoByResolvedPathInfoId = this.#saveInfoByResolvedPathInfoIdByListIndex.get(ref.listIndex);
      if (typeof saveInfoByResolvedPathInfoId === "undefined") {
        saveInfoByResolvedPathInfoId = {};
        this.#saveInfoByResolvedPathInfoIdByListIndex.set(ref.listIndex, saveInfoByResolvedPathInfoId);
      }
      let saveInfo = saveInfoByResolvedPathInfoId[ref.info.id];
      if (typeof saveInfo === "undefined") {
        saveInfo = this.createSaveInfo();
        saveInfoByResolvedPathInfoId[ref.info.id] = saveInfo;
      }

      return saveInfo;
    }
  }
  
  saveBinding(
    ref      : IStatePropertyRef,
    binding  : IBinding
  ): void {
    const saveInfo = this.getSaveInfoByStatePropertyRef(ref);
    saveInfo.bindings.push(binding);
  }

  saveListAndListIndexes(
    ref               : IStatePropertyRef,
    list              : any[] | null,
    listIndexes       : IListIndex[] | null
  ): void {
    const saveInfo = this.getSaveInfoByStatePropertyRef(ref);
    saveInfo.list = list;
    saveInfo.listIndexes = listIndexes;
  }

  getBindings(ref: IStatePropertyRef): IBinding[] {
    const saveInfo = this.getSaveInfoByStatePropertyRef(ref);
    return saveInfo.bindings;
  }

  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null {
    if (this.stateOutput.startsWith(ref.info)) {
      return this.stateOutput.getListIndexes(ref);
    }
    const saveInfo = this.getSaveInfoByStatePropertyRef(ref);
    return saveInfo.listIndexes;
  }

  getListAndListIndexes(ref: IStatePropertyRef): [any[] | null, IListIndex[] | null] {
    const saveInfo = this.getSaveInfoByStatePropertyRef(ref);
    return [saveInfo.list, saveInfo.listIndexes];
  }

  getPropertyValue(ref: IStatePropertyRef): any {
    // プロパティの値を取得する
    const stateProxy = createReadonlyStateProxy(this, this.state);
    return stateProxy[GetByRefSymbol](ref);
  }
  setPropertyValue(ref: IStatePropertyRef, value: any): void {
    // プロパティの値を設定する
    update(this, null, async (updater, stateProxy) => {
      stateProxy[SetByRefSymbol](ref, value);
    });
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