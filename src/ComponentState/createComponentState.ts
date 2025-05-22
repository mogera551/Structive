import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { SetLoopContextSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { BindParentComponentSymbol, RenderSymbol } from "./symbols.js";
import { IComponentState, IComponentStateHandler, IComponentStateProxy } from "./types";

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