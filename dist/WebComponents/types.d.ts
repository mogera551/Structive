import { FilterWithOptions } from "../Filter/types";
export type ComponentType = 'autonomous' | 'builtin';
export interface IComponent {
}
export interface IComponentStatic {
    new (instanceId: number, instanceName: string): IComponent;
    readonly id: number;
    readonly template: HTMLTemplateElement;
    readonly styleSheet: CSSStyleSheet;
    readonly stateClass: typeof Object;
    readonly inputFilters: FilterWithOptions;
    readonly outputFilters: FilterWithOptions;
    readonly listPaths: Set<string>;
    readonly paths: Set<string>;
    readonly trackedGetters: Set<string>;
    html: string;
    css: string;
    define(tagName: string): void;
}
export type Constructor<T = {}> = new (...args: any[]) => T;
export type QuelComponent = HTMLElement & IComponent;
export type QuelComponentClass = Constructor<QuelComponent> & IComponentStatic;
export interface IConfig {
    debug: boolean;
    locale: string;
    enableShadowDom: boolean;
    enableMainWrapper: boolean;
    enableRouter: boolean;
    autoInsertMainWrapper: boolean;
    autoInit: boolean;
    mainTagName: string;
    routerTagName: string;
    layoutPath: string;
}
export interface IUserConfig {
    enableShadowDom?: boolean;
    extends?: string;
}
export interface IComponentConfig {
    enableShadowDom: boolean;
    extends: string | null;
}
export interface IUserComponentData {
    text: string;
    html: string;
    css: string;
    stateClass: typeof Object;
    config: IUserConfig;
}
export type QuelComponentClasses = Record<string, QuelComponentClass>;
export type SingleFileComponents = Record<string, string>;
