import { BindParentComponentSymbol, RenderSymbol } from "./symbols";

export interface IComponentState {
  render(name: string, value: any): void;
  bindParentComponent(): void;
  getPropertyValue(name: string): any;
  setPropertyValue(name: string, value: any): void;
}

export interface IComponentStateHandler {
  get(state: IComponentState, prop: PropertyKey, receiver: IComponentState): any;
  set(state: IComponentState, prop: PropertyKey, value: any, receiver: IComponentState): boolean;
}

export interface IComponentStateProxy extends IComponentState {
  [key:string]: any;
  [RenderSymbol]: (name: string, value: any) => void;
  [BindParentComponentSymbol]: () => void;
}
