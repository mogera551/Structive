import { getListPathsSetById, getPathsSetById } from "../../BindingBuilder/registerDataBindAttributes";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IComponent, StructiveComponentClass } from "../../WebComponents/types";
import { optimizeAccessor } from "../OptimizeAccessor/optimizeAccessor";
import { IStateManager } from "../types";
import { IStatePathInfoManager } from "./types";

class StatePathInfoManager implements IStatePathInfoManager {
  all: Set<IStructuredPathInfo> = new Set();
  getters: Set<IStructuredPathInfo> = new Set();
  onlyGetters: Set<IStructuredPathInfo> = new Set();
  setters: Set<IStructuredPathInfo> = new Set();
  lists: Set<IStructuredPathInfo> = new Set();
  elements: Set<IStructuredPathInfo> = new Set();
  optimizedAccessor: Set<IStructuredPathInfo> = new Set();
  getterPaths: Set<string> = new Set();

  staticDependency: Map<IStructuredPathInfo, Set<IStructuredPathInfo>> = new Map();
  dynamicDependency: Map<IStructuredPathInfo, Set<IStructuredPathInfo>> = new Map();

  componentClass: StructiveComponentClass;
  stateClass: ObjectConstructor;
  constructor(
    componentClass: StructiveComponentClass,
  ) {
    this.componentClass = componentClass;
    this.stateClass = componentClass.stateClass as ObjectConstructor;
    this.readFromStateClass();
    this.readFromTemplate(componentClass.id);
  }

  addAll(info: IStructuredPathInfo): void {
    this.all = this.all.union(info.cumulativeInfoSet);
  }

  /**
   * 
   * @param templateId {number} テンプレートID
   * 
   * テンプレートIDからパスの情報（全パスとリストパスとリスト要素パス）を読み込みます
   */
  #readFromTemplate(templateId: number): void {
    getPathsSetById(templateId).forEach(path => {
      const info = getStructuredPathInfo(path);
      this.all = this.all.union(info.cumulativeInfoSet);
    });
    getListPathsSetById(templateId).forEach(path => {
      const info = getStructuredPathInfo(path);
      this.lists.add(info);
      const elementInfo = getStructuredPathInfo(path + '.*');
      this.elements.add(elementInfo);
    });
  }

  /**
   * 
   * @param stateClass {ObjectConstructor} 状態クラス
   * 
   * 状態クラスのプロパティからgetter/setterを読み込み、getters/settersに追加します。
   * これにより、状態クラスのプロパティがどのようにアクセスされるかを管理します。
   */
  readFromStateClass(): void {
    let current = this.stateClass;
    while (current) {
      const prototype = Object.getPrototypeOf(current);
      if (prototype === Object.prototype) break; // ルートオブジェクトに到達
      for(const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(current))) {
        if (!descriptor.get && !descriptor.set) continue; // getter/setterがない場合はスキップ
        const info = getStructuredPathInfo(key);
        this.all = this.all.union(info.cumulativeInfoSet);
        if (descriptor.get) {
          this.getters.add(info);
          this.getterPaths.add(key);
        }
        if (descriptor.set) {
          this.setters.add(info);
        }
      }
      current = prototype;
    }
    this.onlyGetters = this.getters.symmetricDifference(this.setters);
  }

  readFromTemplate(templateId: number): void {
    const stateClass = this.stateClass;
    const savedAll = new Set(this.all);
    this.#readFromTemplate(templateId);
    const addedInfos = this.all.difference(savedAll);
    for(const info of addedInfos) {
      if (this.getters.has(info)) continue; // 既にgetterとして登録されている場合はスキップ
      if (this.setters.has(info)) continue; // 既にsetterとして登録されている場合はスキップ
      if (info.pathSegments.length === 1) continue; // プレーンなパスはスキップ
      if (this.optimizedAccessor.has(info)) continue; // 既に最適化されている場合はスキップ
      if (optimizeAccessor(stateClass, info, this.getterPaths)) {
        this.optimizedAccessor.add(info);
      }
    }
  }

  addStaticDependency(source: IStructuredPathInfo, reference: IStructuredPathInfo): void {
    let dependencies = this.staticDependency.get(reference);
    if (typeof dependencies === 'undefined') {
      dependencies = new Set();
      this.staticDependency.set(reference, dependencies);
    }
    dependencies.add(source);
  }

  addDynamicDependency(source: IStructuredPathInfo, reference: IStructuredPathInfo): void {
    let dependencies = this.dynamicDependency.get(reference);
    if (typeof dependencies === 'undefined') {
      dependencies = new Set();
      this.dynamicDependency.set(reference, dependencies);
    }
    dependencies.add(source);
  }
}

export function createStatePathInfoManager(
  componentClass: StructiveComponentClass
): IStatePathInfoManager {
  return new StatePathInfoManager(componentClass);
}