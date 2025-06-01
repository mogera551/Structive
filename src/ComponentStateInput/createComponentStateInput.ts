import { IComponentEngine } from "../ComponentEngine/types";
import { IComponentStateBinding } from "../ComponentStateBinding/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { AssignStateSymbol, NotifyRedrawSymbol } from "./symbols";
import { IComponentStateInput, IComponentStateInputHandler } from "./types";

class ComponentStateInputHandler implements IComponentStateInputHandler {
  private componentStateBinding: IComponentStateBinding;
  private engine: IComponentEngine;
  constructor(engine:IComponentEngine, componentStateBinding: IComponentStateBinding) {
    this.componentStateBinding = componentStateBinding;
    this.engine = engine;
  }

  assignState(object: any): void {
    this.engine.useWritableStateProxy(null, async (state) => {
      for(const [key, value] of Object.entries(object)) {
        const childPathInfo = getStructuredPathInfo(key);
        this.engine.setPropertyValue(childPathInfo, null, value);
      }
    });
  }

  /**
   * listindexに一致するかどうかは事前にスクリーニングしておく
   * @param refs 
   */
  notifyRedraw(refs: IStatePropertyRef[]): void {
    for(const parentPathInfo of refs) {
      try {
        const childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathInfo.info.pattern);
        const childPathInfo = getStructuredPathInfo(childPath);
        const value = this.engine.getPropertyValue(childPathInfo, null)
        this.engine.updater.addUpdatedStatePropertyRefValue(childPathInfo, null, value)
      } catch(e) {
        // 対象でないものは何もしない
      }
    }
  }

  get(target:any, prop:PropertyKey, receiver:IComponentStateInput) {
    if (prop === AssignStateSymbol) {
      return this.assignState.bind(this);
    } else if (prop === NotifyRedrawSymbol) {
      return this.notifyRedraw.bind(this);
    } else if (typeof prop === "string") {
      return this.engine.getPropertyValue(getStructuredPathInfo(prop), null);
    }
    raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
  }

  set(target:any, prop:PropertyKey, value:any, receiver:IComponentStateInput): boolean {
    if (typeof prop === "string") {
      this.engine.setPropertyValue(getStructuredPathInfo(prop), null, value);
      return true;
    }
    raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
  }
}

export function createComponentStateInput(
  engine: IComponentEngine,
  componentStateBinding: IComponentStateBinding
): IComponentStateInput {
  const handler = new ComponentStateInputHandler(engine, componentStateBinding);
  return new Proxy({}, handler) as IComponentStateInput;
}