import { FilterWithOptions } from "../Filter/types";
import { IStructiveState } from "../StateClass/types";
export type ComponentType = 'autonomous' | 'builtin';
export interface IComponent {
    readonly parentStructiveComponent: IComponent | null;
    readonly state: IStructiveState;
    readonly isStructive: boolean;
}
export interface IComponentStatic {
    new (instanceId: number, instanceName: string): IComponent;
    readonly id: number;
    readonly template: HTMLTemplateElement;
    readonly styleSheet: CSSStyleSheet;
    readonly stateClass: IStructiveState;
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
export type StructiveComponent = HTMLElement & IComponent;
export type StructiveComponentClass = Constructor<StructiveComponent> & IComponentStatic;
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
    stateClass: IStructiveState;
}
export type StructiveComponentClasses = Record<string, StructiveComponentClass>;
export type SingleFileComponents = Record<string, string>;
