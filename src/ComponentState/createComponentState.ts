import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { SetLoopContextSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { BindParentComponentSymbol, RenderSymbol } from "./symbols.js";
import { IComponentState, IComponentStateHandler, IComponentStateProxy } from "./types";

/**
 * createComponentState.ts
 * 
 * Structiveコンポーネントの状態管理を担う「ComponentState」クラスと、そのプロキシ生成関数の実装。
 *
 * 主な役割:
 * - 親コンポーネントとのバインディング（親プロパティのgetter/setterを動的に定義）
 * - 親コンポーネントからのバインディング一括登録（bindParentComponent）
 * - 状態プロパティの取得・設定・レンダリング（getPropertyValue, setPropertyValue, render）
 * - Proxyハンドラで、プロパティアクセスを自動的にget/set/特殊メソッドに振り分け
 *
 * 構造・設計ポイント:
 * - 親子コンポーネント間のデータ連携を柔軟に実現
 * - ループコンテキストや非同期更新にも対応
 * - Proxyによる柔軟なAPI（state.xxxで直接アクセス可能）
 *
 * @param engine IComponentEngineインスタンス
 * @returns      IComponentStateProxy（Proxyラップされた状態オブジェクト）
 */
class ComponentState implements IComponentState {
  engine: IComponentEngine;
  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  bindParentProperty(binding: IBinding): void {
    const propName = binding.bindingNode.subName;
    Object.defineProperty(this.engine.state, propName, {
      get: () => {
        return binding.bindingState.filteredValue;
      },
      set: (value: any) => {
        const engine = binding.engine;
        const loopContext = binding.parentBindContent.currentLoopContext;
        engine.updater.addProcess(async () => {
          const stateProxy = engine.createWritableStateProxy();
          await stateProxy[SetLoopContextSymbol](loopContext, async () => {
            return binding.updateStateValue(stateProxy, value);
          });
        });
      }
    });
  }

  unbindParentProperty(binding: IBinding): void {
    const propName = binding.bindingNode.subName;
    Object.defineProperty(this.engine.state, propName, { value:undefined });
  }
  
  bindParentComponent(): void {
    // bindParentComponent
    const parent = this.engine.owner.parentStructiveComponent;
    if (parent === null) {
      return;
    }
    const bindings = parent.getBindingsFromChild(this.engine.owner);
    for (const binding of bindings ?? []) {
      this.bindParentProperty(binding);
    }
  }

  render(name: string, value:any): void {
    // render
    const info = getStructuredPathInfo(name);
    this.engine.updater.addUpdatedStatePropertyRefValue(info, null, value)
  }

  getPropertyValue(name: string): any {
    // getPropertyValue
    const info = getStructuredPathInfo(name);
    return this.engine.getPropertyValue(info, null);
  }

  setPropertyValue(name: string, value: any): void {
    // setPropertyValue
    const info = getStructuredPathInfo(name);
    this.engine.setPropertyValue(info, null, value); 
  }
}

class ComponentStateHandler implements IComponentStateHandler {
  get(state: IComponentState, prop: PropertyKey, receiver: IComponentState): any {
    if (prop === RenderSymbol) {
      return state.render.bind(state);
    } else if (prop === BindParentComponentSymbol) {
      return state.bindParentComponent.bind(state);
    } else if (typeof prop === 'string') {
      return state.getPropertyValue(prop);
    } else {
      return Reflect.get(state, prop, receiver);
    }
  }

  set(state: IComponentState, prop: PropertyKey, value: any, receiver: IComponentState): boolean {
    if (typeof prop === 'string') {
      state.setPropertyValue(prop, value);
      return true;
    } else {
      return Reflect.set(state, prop, value, receiver);
    }
  }
};

export const createComponentState = (engine: IComponentEngine): IComponentStateProxy => {
  return new Proxy<IComponentState>(new ComponentState(engine), new ComponentStateHandler()) as IComponentStateProxy;
}