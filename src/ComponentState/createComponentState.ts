import { IComponentEngine } from "../ComponentEngine/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IComponentState } from "./types";

class ComponentState implements IComponentState {
  engine: IComponentEngine;
  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }
  render(name: string, value:any): void {
    // @ts-ignore
    // render
    const info = getStructuredPathInfo(name);
    this.engine.updater.addUpdatedStatePropertyRefValue(info, null, value)
  }
}

export const createComponentState = (engine: IComponentEngine): IComponentState => {
  return new ComponentState(engine);
}