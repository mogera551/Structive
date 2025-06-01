import { IStatePropertyRef } from "../StatePropertyRef/types";
import { AssignStateSymbol, NotifyRedrawSymbol } from "./symbols";

export interface IComponentStateInputHandler {
  assignState(object: any): void;
  notifyRedraw(refs: IStatePropertyRef[]): void;
}

export interface IComponentStateInput {
  [key:string]: any;
  [AssignStateSymbol]: (json: any) => void;
  [NotifyRedrawSymbol]: (refs: IStatePropertyRef[]) => void;
}

