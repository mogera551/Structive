import { Filters, FilterWithOptions } from "../Filter/types";
import { IComponentEngine } from "../ComponentEngine/types";

export type ComponentType = 'autonomous' | 'builtin';

export interface IComponent {
}

export interface IComponentStatic {
  new(instanceId: number, instanceName: string): IComponent;
  readonly id            : number;
  readonly template      : HTMLTemplateElement;
  readonly styleSheet    : CSSStyleSheet;
  readonly stateClass    : typeof Object;
  readonly inputFilters  : FilterWithOptions;
  readonly outputFilters : FilterWithOptions;
  readonly listPaths     : Set<string>;
  readonly paths         : Set<string>;
  readonly trackedGetters: Set<string>;
  html:string;
  css:string;
  define(tagName:string):void;
}
export type Constructor<T = {}> = new (...args: any[]) => T;

export type QuelComponent = HTMLElement & IComponent;

export type QuelComponentClass = Constructor<QuelComponent> & IComponentStatic;

export interface IConfig {
  debug                : boolean;
  locale               : string; // The locale of the component, ex. "en-US", default is "en-US"
  enableShadowDom      : boolean; // Whether to use Shadow DOM or not
  enableMainWrapper    : boolean; // Whether to use the main wrapper or not
  enableRouter         : boolean; // Whether to use the router or not
  autoInsertMainWrapper: boolean; // Whether to automatically insert the main wrapper or not
  autoInit             : boolean; // Whether to automatically initialize the component or not
  mainTagName          : string; // The tag name of the main wrapper, default is "app-main"
  routerTagName        : string; // The tag name of the router, default is "view-router"
  layoutPath           : string; // The path to the layout file, default is "src/layout.html"

}

export interface IUserConfig {
  enableShadowDom?: boolean; // Whether to use Shadow DOM or not
  extends?        : string; // The tag name of the component to extend
}

export interface IComponentConfig {
  enableShadowDom: boolean; // Whether to use Shadow DOM or not
  extends        : string | null; // The tag name of the component to extend
}

export interface IUserComponentData {
  text      : string; // The text content of the component file
  html      : string; // The HTML content of the component file
  css       : string;  // The CSS content of the component file
  stateClass: typeof Object; // The class that will be used to create the state object
  config    : IUserConfig;
}

export type QuelComponentClasses = Record<string, QuelComponentClass>;

export type SingleFileComponents = Record<string, string>;
