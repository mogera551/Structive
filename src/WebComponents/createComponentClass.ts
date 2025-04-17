import { inputBuiltinFilters, outputBuiltinFilters } from "../Filter/builtinFilters";
import { FilterWithOptions } from "../Filter/types";
import { generateId } from "../GlobalId/generateId";
import { getStateClassById, registerStateClass } from "../StateClass/registerStateClass";
import { getStyleSheetById } from "../StyleSheet/registerStyleSheet";
import { registerCss } from "../StyleSheet/regsiterCss";
import { createComponentEngine } from "../ComponentEngine/ComponentEngine";
import { IComponentEngine } from "../ComponentEngine/types";
import { registerHtml } from "../Template/registerHtml";
import { getTemplateById } from "../Template/registerTemplate";
import { getBaseClass } from "./getBaseClass";
import { getComponentConfig } from "./getComponentConfig";
import { IComponent, QuelComponent, IUserComponentData, IComponentStatic, QuelComponentClass } from "./types";
import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes";

export function createComponentClass(componentData: IUserComponentData): QuelComponentClass {
  const componentConfig = getComponentConfig(componentData.config);
  const id = generateId();
  const { html, css, stateClass } = componentData;
  const inputFilters:FilterWithOptions = Object.assign({}, inputBuiltinFilters);
  const outputFilters:FilterWithOptions = Object.assign({}, outputBuiltinFilters);
  registerHtml(id, html);
  registerCss(id, css);
  registerStateClass(id, stateClass);
  const baseClass = getBaseClass(componentConfig.extends);
  const extendTagName = componentConfig.extends;
  return class extends baseClass implements IComponent {
    #engine: IComponentEngine;

    constructor() {
      super();
      this.#engine = createComponentEngine(componentConfig, this as QuelComponent);
    }

    connectedCallback() {
      this.#engine.connectedCallback();
    }

    disconnectedCallback() {
      this.#engine.disconnectedCallback();
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
    static #stateClass: typeof Object | null = null;
    static get stateClass():typeof Object {
      if (!this.#stateClass) {
        this.#stateClass = getStateClassById(this.id);
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
    static get listPaths(): Set<string> {
      return getListPathsSetById(this.id);
    }
    static get paths(): Set<string> {
      return getPathsSetById(this.id);
    }
    static #trackedGetters: Set<string> | null = null;
    static get trackedGetters(): Set<string> {
      if(this.#trackedGetters === null) {
        this.#trackedGetters = new Set<string>();
        let currentProto = this.stateClass.prototype;
        while (currentProto && currentProto !== Object.prototype) {
          const trackedGetters = Object.getOwnPropertyDescriptors(currentProto);
          if (trackedGetters) {
            for (const [key, desc] of Object.entries(trackedGetters)) {
              if (desc.get) {
                this.#trackedGetters.add(key);
              }
            }
          }
          currentProto = Object.getPrototypeOf(currentProto);
        }
      }
      return this.#trackedGetters;

    }
  } as QuelComponentClass;
}
