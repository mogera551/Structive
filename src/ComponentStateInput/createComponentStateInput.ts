import { IComponentEngine } from "../ComponentEngine/types";
import { IComponentStateBinding } from "../ComponentStateBinding/types";
import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { update2 } from "../Updater2/Updater2";
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
    update2(this.engine, null, async (updater, stateProxy) => {
      for(const [key, value] of Object.entries(object)) {
        const childPathInfo = getStructuredPathInfo(key);
        stateProxy[SetByRefSymbol](childPathInfo, null, value);
      }     
    });
  }

  /**
   * listindexに一致するかどうかは事前にスクリーニングしておく
   * @param refs 
   */
  notifyRedraw(refs: IStatePropertyRef[]): void {
    for(const parentPathRef of refs) {
      try {
        const childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathRef.info.pattern);
        const childPathInfo = getStructuredPathInfo(childPath);
        const childListIndex = parentPathRef.listIndex;
        const value = this.engine.getPropertyValue(childPathInfo, childListIndex);
        // Ref情報をもとに状態更新キューに追加
        update2(this.engine, null, async (updater, stateProxy) => {
          updater.enqueueRef(childPathInfo, childListIndex, value);
        });
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