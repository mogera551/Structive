import { IComponentEngine } from "../ComponentEngine/types";
import { IComponentStateBinding } from "../ComponentStateBinding/types";
import { SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { createUpdater } from "../Updater/Updater";
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
    createUpdater(this.engine, (updater) => {
      updater.update(null, (stateProxy, handler) => {
        for(const [key, value] of Object.entries(object)) {
          const childPathInfo = getStructuredPathInfo(key);
          const childRef = getStatePropertyRef(childPathInfo, null);
          stateProxy[SetByRefSymbol](childRef, value);
        }
      });
    });
  }

  /**
   * listindexに一致するかどうかは事前にスクリーニングしておく
   * @param refs 
   */
  notifyRedraw(refs: IStatePropertyRef[]): void {
    createUpdater(this.engine, (updater) => {
      for(const parentPathRef of refs) {
        let childPath;
        try {
          childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathRef.info.pattern);
        } catch(e) {
          // 対象でないものは何もしない
          continue;
        }
        const childPathInfo = getStructuredPathInfo(childPath);
        const atIndex = childPathInfo.wildcardCount - 1;
        const childListIndex = (atIndex >= 0) ? (parentPathRef.listIndex?.at(atIndex) ?? null) : null;
        if (atIndex >= 0 && childListIndex === null) {
          raiseError({
            code: 'LIST-201',
            message: `ListIndex not found for parent ref: ${parentPathRef.info.pattern}`,
            context: {
              where: 'ComponentStateInput.notifyRedraw',
              parentPattern: parentPathRef.info.pattern,
              childPattern: childPathInfo.pattern,
            },
            docsUrl: '/docs/error-codes.md#list',
          });
        }
        const childRef = getStatePropertyRef(childPathInfo, childListIndex);
        const value = this.engine.getPropertyValue(childRef);
        // Ref情報をもとに状態更新キューに追加
        updater.enqueueRef(childRef);
      }
    });
  }

  get(target:any, prop:PropertyKey, receiver:IComponentStateInput) {
    if (prop === AssignStateSymbol) {
      return this.assignState.bind(this);
    } else if (prop === NotifyRedrawSymbol) {
      return this.notifyRedraw.bind(this);
    } else if (typeof prop === "string") {
      const ref = getStatePropertyRef(getStructuredPathInfo(prop), null);
      return this.engine.getPropertyValue(ref);
    }
    raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
  }

  set(target:any, prop:PropertyKey, value:any, receiver:IComponentStateInput): boolean {
    if (typeof prop === "string") {
      const ref = getStatePropertyRef(getStructuredPathInfo(prop), null);
      this.engine.setPropertyValue(ref, value);
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