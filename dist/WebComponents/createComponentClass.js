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
import { generateId } from "../GlobalId/generateId.js";
import { getStateClassById, registerStateClass } from "../StateClass/registerStateClass.js";
import { getStyleSheetById } from "../StyleSheet/registerStyleSheet.js";
import { registerCss } from "../StyleSheet/regsiterCss.js";
import { createComponentEngine } from "../ComponentEngine/ComponentEngine.js";
import { registerHtml } from "../Template/registerHtml.js";
import { getTemplateById } from "../Template/registerTemplate.js";
import { getBaseClass } from "./getBaseClass.js";
import { getComponentConfig } from "./getComponentConfig.js";
import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes.js";
import { createComponentState } from "../ComponentState/createComponentState.js";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { createAccessorFunctions } from "../StateProperty/createAccessorFunctions.js";
import { config as globalConfig } from "./getGlobalConfig.js";
import { raiseError } from "../utils.js";
function findStructiveParent(el) {
    let current = el.parentNode;
    while (current) {
        if (current.state && current.isStructive) {
            return current;
        }
        current = current.parentNode;
        if (current instanceof ShadowRoot) {
            if (current.host && current.host.state && current.host.isStructive) {
                return current.host;
            }
            current = current.host;
        }
    }
    return null;
}
export function createComponentClass(componentData) {
    const config = (componentData.stateClass.$config ?? {});
    const componentConfig = getComponentConfig(config);
    const id = generateId();
    const { html, css, stateClass } = componentData;
    const inputFilters = Object.assign({}, inputBuiltinFilters);
    const outputFilters = Object.assign({}, outputBuiltinFilters);
    stateClass.$isStructive = true;
    registerHtml(id, html);
    registerCss(id, css);
    registerStateClass(id, stateClass);
    const baseClass = getBaseClass(componentConfig.extends);
    const extendTagName = componentConfig.extends;
    return class extends baseClass {
        #engine;
        #componentState;
        constructor() {
            super();
            this.#engine = createComponentEngine(componentConfig, this);
            this.#componentState = createComponentState(this.#engine);
        }
        connectedCallback() {
            this.#engine.connectedCallback();
        }
        disconnectedCallback() {
            this.#engine.disconnectedCallback();
        }
        #parentStructiveComponent;
        get parentStructiveComponent() {
            if (typeof this.#parentStructiveComponent === "undefined") {
                this.#parentStructiveComponent = findStructiveParent(this);
            }
            return this.#parentStructiveComponent;
        }
        get state() {
            return this.#componentState;
        }
        get isStructive() {
            return this.#engine.stateClass.$isStructive ?? false;
        }
        getBindingsFromChild(component) {
            return this.#engine.bindingsByComponent.get(component) ?? null;
        }
        static define(tagName) {
            if (extendTagName) {
                customElements.define(tagName, this, { extends: extendTagName });
            }
            else {
                customElements.define(tagName, this);
            }
        }
        static get id() {
            return id;
        }
        static #html = html;
        static get html() {
            return this.#html;
        }
        static set html(value) {
            this.#html = value;
            registerHtml(this.id, value);
            this.#template = null;
        }
        static #css = css;
        static get css() {
            return this.#css;
        }
        static set css(value) {
            this.#css = value;
            registerCss(this.id, value);
            this.#styleSheet = null;
        }
        static #template = null;
        static get template() {
            if (!this.#template) {
                this.#template = getTemplateById(this.id);
            }
            return this.#template;
        }
        static #styleSheet = null;
        static get styleSheet() {
            if (!this.#styleSheet) {
                this.#styleSheet = getStyleSheetById(this.id);
            }
            return this.#styleSheet;
        }
        static #stateClass = null;
        static get stateClass() {
            if (!this.#stateClass) {
                this.#stateClass = getStateClassById(this.id);
            }
            return this.#stateClass;
        }
        static #inputFilters = inputFilters;
        static get inputFilters() {
            return this.#inputFilters;
        }
        static #outputFilters = outputFilters;
        static get outputFilters() {
            return this.#outputFilters;
        }
        static get listPaths() {
            return getListPathsSetById(this.id);
        }
        static get paths() {
            return getPathsSetById(this.id);
        }
        static #getters = null;
        static get getters() {
            return this.#getters ?? raiseError("getters is null");
        }
        static #trackedGetters = null;
        static get trackedGetters() {
            if (this.#trackedGetters === null) {
                this.#trackedGetters = new Set();
                this.#getters = new Set();
                let currentProto = this.stateClass.prototype;
                while (currentProto && currentProto !== Object.prototype) {
                    const trackedGetters = Object.getOwnPropertyDescriptors(currentProto);
                    if (trackedGetters) {
                        for (const [key, desc] of Object.entries(trackedGetters)) {
                            if (desc.get && !desc.set) {
                                this.#trackedGetters.add(key);
                            }
                            this.#getters.add(key);
                        }
                    }
                    currentProto = Object.getPrototypeOf(currentProto);
                }
                if (globalConfig.optimizeAccessor) {
                    for (const path of this.paths) {
                        const info = getStructuredPathInfo(path);
                        if (info.pathSegments.length === 1) {
                            continue;
                        }
                        if (this.#getters.has(path)) {
                            continue;
                        }
                        const funcs = createAccessorFunctions(info, this.#getters);
                        Object.defineProperty(this.stateClass.prototype, path, {
                            get: funcs.get,
                            set: funcs.set,
                            enumerable: true,
                            configurable: true,
                        });
                    }
                }
            }
            return this.#trackedGetters;
        }
    };
}
