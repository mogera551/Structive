/**
 * createComponentClass.ts
 *
 * StructiveのWeb Components用カスタム要素クラスを動的に生成するユーティリティです。
 *
 * 主な役割:
 * - ユーザー定義のcomponentData（stateClass, html, css等）からWeb Componentsクラスを生成
 * - StateClass/テンプレート/CSS/バインディング情報などをIDで一元管理・登録
 * - 独自のget/setトラップやバインディング、親子コンポーネント探索、フィルター拡張など多機能な基盤を提供
 * - 静的プロパティでテンプレート・スタイル・StateClass・フィルター・getter情報などにアクセス可能
 * - defineメソッドでカスタム要素として登録
 *
 * 設計ポイント:
 * - findStructiveParentで親Structiveコンポーネントを探索し、階層的な状態管理を実現
 * - getter/setter/バインディング最適化やアクセサ自動生成（optimizeAccessor）に対応
 * - テンプレート・CSS・StateClass・バインディング情報をIDで一元管理し、再利用性・拡張性を確保
 * - フィルターやバインディング情報も静的プロパティで柔軟に拡張可能
 */
import { inputBuiltinFilters, outputBuiltinFilters } from "../Filter/builtinFilters.js";
import { FilterWithOptions } from "../Filter/types";
import { generateId } from "../GlobalId/generateId.js";
import { getStateClassById, registerStateClass } from "../StateClass/registerStateClass.js";
import { getStyleSheetById } from "../StyleSheet/registerStyleSheet.js";
import { registerCss } from "../StyleSheet/regsiterCss.js";
import { createComponentEngine } from "../ComponentEngine/ComponentEngine.js";
import { IComponentEngine } from "../ComponentEngine/types.js";
import { registerHtml } from "../Template/registerHtml.js";
import { getTemplateById } from "../Template/registerTemplate.js";
import { getBaseClass } from "./getBaseClass.js";
import { getComponentConfig } from "./getComponentConfig.js";
import { IComponent, IUserComponentData, IUserConfig, StructiveComponentClass, StructiveComponent } from "./types";
import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes.js";
import { IStructiveState } from "../StateClass/types";
import { IBinding } from "../DataBinding/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { createAccessorFunctions } from "../StateProperty/createAccessorFunctions.js";
import { config as globalConfig } from "./getGlobalConfig.js";
import { raiseError } from "../utils.js";
import { IComponentStateInput } from "../ComponentStateInput/types.js";
import { findStructiveParent } from "./findStructiveParent.js";
import { IPathManager } from "../PathManager/types.js";
import { createPathManager } from "../PathManager/PathManager.js";


export function createComponentClass(componentData: IUserComponentData): StructiveComponentClass {
  const config = (componentData.stateClass.$config ?? {})as IUserConfig;
  const componentConfig = getComponentConfig(config);
  const id = generateId();
  const { html, css, stateClass } = componentData;
  const inputFilters:FilterWithOptions = Object.assign({}, inputBuiltinFilters);
  const outputFilters:FilterWithOptions = Object.assign({}, outputBuiltinFilters);
  stateClass.$isStructive = true;
  registerHtml(id, html);
  registerCss(id, css);
  registerStateClass(id, stateClass);
  const baseClass = getBaseClass(componentConfig.extends);
  const extendTagName = componentConfig.extends;
  return class extends baseClass implements IComponent {
    #engine: IComponentEngine;

    constructor() {
      super();
      this.#engine = createComponentEngine(componentConfig, this as StructiveComponent);
      this.#engine.setup();
    }

    connectedCallback() {
      this.#engine.connectedCallback();
    }

    disconnectedCallback() {
      this.#engine.disconnectedCallback();
    }

    #parentStructiveComponent: StructiveComponent | null | undefined;
    get parentStructiveComponent(): StructiveComponent | null {
      if (typeof this.#parentStructiveComponent === "undefined") {
        this.#parentStructiveComponent = findStructiveParent(this as StructiveComponent);
      }
      return this.#parentStructiveComponent;
    }

    get state(): IComponentStateInput {
      return this.#engine.stateInput;
    }

    get isStructive(): boolean {
      return this.#engine.stateClass.$isStructive ?? false;
    }

    get waitForInitialize(): PromiseWithResolvers<void> {
      return this.#engine.waitForInitialize;
    }

    getBindingsFromChild(component: IComponent): Set<IBinding> | null {
      return this.#engine.bindingsByComponent.get(component as StructiveComponent) ?? null;
    }

    registerChildComponent(component:StructiveComponent): void {
      this.#engine.registerChildComponent(component);
    }
    unregisterChildComponent(component:StructiveComponent): void {
      this.#engine.unregisterChildComponent(component);
    }
    static define(tagName:string) {
      if (extendTagName) {
        customElements.define(tagName, this, { extends: extendTagName });
      } else {
        customElements.define(tagName, this);
      }
    }

    static get id():number {
      return id;
    }
    static #html:string = html;
    static get html():string {
      return this.#html;
    }
    static set html(value:string) {
      this.#html = value;
      registerHtml(this.id, value);
      this.#template = null;
      this.#pathManager = null; // パス情報をリセット
    }

    static #css:string = css;
    static get css() {
      return this.#css;
    }
    static set css(value:string) {
      this.#css = value;
      registerCss(this.id, value);
      this.#styleSheet = null;
    }
    static #template: HTMLTemplateElement | null = null;
    static get template():HTMLTemplateElement {
      if (!this.#template) {
        this.#template = getTemplateById(this.id);
      }
      return this.#template;
    }
    static #styleSheet: CSSStyleSheet | null = null;
    static get styleSheet():CSSStyleSheet {
      if (!this.#styleSheet) {
        this.#styleSheet = getStyleSheetById(this.id);
      }
      return this.#styleSheet;
    }
    static #stateClass: IStructiveState | null = null;
    static get stateClass():IStructiveState {
      if (!this.#stateClass) {
        this.#stateClass = getStateClassById(this.id) as IStructiveState;
      }
      return this.#stateClass;
    }
    static #inputFilters:FilterWithOptions = inputFilters;
    static get inputFilters():FilterWithOptions {
      return this.#inputFilters;
    }
    static #outputFilters:FilterWithOptions = outputFilters;
    static get outputFilters():FilterWithOptions {
      return this.#outputFilters;
    }
    static #pathManager: IPathManager | null = null;
    static get pathManager(): IPathManager {
      if (!this.#pathManager) {
        this.#pathManager = createPathManager(this as StructiveComponentClass);
      }
      return this.#pathManager;
    }

  } as StructiveComponentClass;
}
