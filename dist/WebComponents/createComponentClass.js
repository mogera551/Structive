import { inputBuiltinFilters, outputBuiltinFilters } from "../Filter/builtinFilters";
import { generateId } from "../GlobalId/generateId";
import { getStateClassById, registerStateClass } from "../StateClass/registerStateClass";
import { getStyleSheetById } from "../StyleSheet/registerStyleSheet";
import { registerCss } from "../StyleSheet/regsiterCss";
import { createComponentEngine } from "../ComponentEngine/ComponentEngine";
import { registerHtml } from "../Template/registerHtml";
import { getTemplateById } from "../Template/registerTemplate";
import { getBaseClass } from "./getBaseClass";
import { getComponentConfig } from "./getComponentConfig";
import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes";
import { createComponentState } from "../ComponentState/createComponentState";
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
            return this.state.constructor.$isStructive ?? false;
        }
        getBindings(component) {
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
        static #trackedGetters = null;
        static get trackedGetters() {
            if (this.#trackedGetters === null) {
                this.#trackedGetters = new Set();
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
    };
}
