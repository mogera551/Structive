import { createBindContent } from "../DataBinding/BindContent.js";
import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IState, IStateProxy, IStructiveState } from "../StateClass/types";
import { createStateProxy } from "../StateClass/createStateProxy.js";
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

export class ComponentEngine implements IComponentEngine {
  type          : ComponentType = 'autonomous';
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
  baseClass     : typeof HTMLElement = HTMLElement;
  owner         : StructiveComponent;
  trackedGetters: Set<string>;

  listInfoSet       : Set<IStructuredPathInfo> = new Set();
  elementInfoSet: Set<IStructuredPathInfo> = new Set();
  bindingsByListIndex                  : WeakMap<IListIndex, Set<IBinding>> = new WeakMap();
  dependentTree                        : Map<IStructuredPathInfo, Set<IStructuredPathInfo>> = new Map();

  bindingsByComponent: WeakMap<StructiveComponent, Set<IBinding>> = new WeakMap();

  #waitForInitialize : PromiseWithResolvers<void> = Promise.withResolvers<void>();
  #loopContext       : ILoopContext | null = null;
  #stackStructuredPathInfo  : IStructuredPathInfo[] = [];
  #stackListIndex    : (IListIndex | null)[] = [];

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
    this.stateProxy = createStateProxy(this, this.state);
    this.updater = createUpdater(this);
    this.inputFilters = componentClass.inputFilters;
    this.outputFilters = componentClass.outputFilters;
    this.owner = owner;
    this.trackedGetters = componentClass.trackedGetters;
    // 依存関係の木を作成する
    const checkDependentProp = (info: IStructuredPathInfo) => {
      const parentInfo = info.parentInfo;
      if (parentInfo === null) return;
      this.addDependentProp(info, parentInfo);
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
      const value = this.stateProxy[GetByRefSymbol](info, null)
      buildListIndexTree(this, info, null, value);
    }
  
    this.updater.main(this.#waitForInitialize);
  }

  async connectedCallback(): Promise<void> {
    if (this.owner.dataset.state) {
      try {
        const json = JSON.parse(this.owner.dataset.state);
        for(const [key, value] of Object.entries(json)) {
          const info = getStructuredPathInfo(key);
          if (info.wildcardCount > 0) continue;
          this.stateProxy[SetByRefSymbol](info, null, value);
        }
      } catch(e) {
        raiseError("Failed to parse state from dataset");
      }
    }
    this.owner.state[BindParentComponentSymbol]();
    attachShadow(this.owner, this.config, this.styleSheet);
    await this.stateProxy[ConnectedCallbackSymbol]();
    await this.stateProxy[SetCacheableSymbol](async () => {
      this.bindContent.render();
    });
    this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
    this.#waitForInitialize.resolve();
  }

  async disconnectedCallback(): Promise<void> {
    await this.stateProxy[DisconnectedCallbackSymbol]();
  }

  async setLoopContext(loopContext: ILoopContext, callback: ()=>Promise<void>): Promise<void> {
    try {
      if (this.#loopContext !== null) {
        throw new Error("loopContext is already set");
      }
      this.#loopContext = loopContext;
      await this.asyncSetStatePropertyRef(loopContext.info, loopContext.listIndex, async () => {
        await callback();
      });
    } finally {
      this.#loopContext = null;
    }
  }

  async asyncSetStatePropertyRef(
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    callback : ()=>Promise<any>
  ): Promise<any> {
    this.#stackStructuredPathInfo.push(info);
    this.#stackListIndex.push(listIndex);
    try {
      return await callback();
    } finally {
      this.#stackStructuredPathInfo.pop();
      this.#stackListIndex.pop();
    }
  }

  setStatePropertyRef(
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    callback : ()=>any
  ): any {
    this.#stackStructuredPathInfo.push(info);
    this.#stackListIndex.push(listIndex);
    try {
      return callback();
    } finally {
      this.#stackStructuredPathInfo.pop();
      this.#stackListIndex.pop();
    }
  }

  getLastStatePropertyRef(): {info:IStructuredPathInfo, listIndex:IListIndex | null} | null {
    if (this.#stackStructuredPathInfo.length === 0) {
      return null;
    }
    const info = this.#stackStructuredPathInfo[this.#stackStructuredPathInfo.length - 1];
    if (typeof info === "undefined") {
      return null;
    }
    const listIndex = this.#stackListIndex[this.#stackListIndex.length - 1];
    if (typeof listIndex === "undefined") {
      return null;
    }
    return {info, listIndex};
  }

  getContextListIndex(structuredPath: string): IListIndex | null{
    const lastRef = this.getLastStatePropertyRef();
    if (lastRef === null) {
      return null;
    }
    const info = lastRef.info;
    const index = info.wildcardPaths.indexOf(structuredPath);
    if (index >= 0) {
      return lastRef.listIndex?.at(index) ?? null;
    }
    return null;
  }
  getLoopContexts():ILoopContext[] {
    if (this.#loopContext === null) {
      throw new Error("loopContext is null");
    }
    return this.#loopContext.serialize();
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

  addDependentProp(info: IStructuredPathInfo, refInfo: IStructuredPathInfo) {
    let dependents = this.dependentTree.get(refInfo);
    if (typeof dependents === "undefined") {
      dependents = new Set<IStructuredPathInfo>();
      this.dependentTree.set(refInfo, dependents);
    }
    dependents.add(info);
  }

  getPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null): any {
    // プロパティの値を取得する
    return this.stateProxy[GetByRefSymbol](info, listIndex);
  }
  setPropertyValue(info: IStructuredPathInfo, listIndex:IListIndex | null, value: any): void {
    // プロパティの値を設定する
    this.updater.addProcess(() => {
      this.stateProxy[SetByRefSymbol](info, listIndex, value);
    });
  }
}

export function createComponentEngine(config: IComponentConfig, component: StructiveComponent): IComponentEngine {
  return new ComponentEngine(config, component);
}