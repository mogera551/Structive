import { IBinding } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { render } from "./render.js";
import { SetCacheableSymbol } from "../StateClass/symbols.js";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { raiseError } from "../utils.js";
import { getGlobalConfig } from "../WebComponents/getGlobalConfig.js";
import { IUpdater } from "./types";
import { restructListIndexes } from "./restructListIndex";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { registerRender } from "./registerRender";
import { IStateProxy } from "../StateClass/types";


class Updater implements IUpdater {
  processList      : (() => Promise<void> | void)[] = [];
  updatedProperties: Set<IStatePropertyRef | IListIndex> = new Set;
  updatedValues    : {[key:string]: any} = {};
  engine           : IComponentEngine;
  version          : number = 0;
  #readonlyState   : IStateProxy;

  constructor(engine: IComponentEngine) {
    this.engine = engine;
    this.#readonlyState = engine.createReadonlyStateProxy();
  }

  get readonlyState(): IStateProxy {
    return this.#readonlyState;
  }

  addProcess(process: () => Promise<void> | void): void {
    queueMicrotask(process);
  }

  addUpdatedStatePropertyRefValue(
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    value    : any
  ): void {
    const refKey = createRefKey(info, listIndex);
    this.updatedProperties.add({info, listIndex});
    this.updatedValues[refKey] = value;
    registerRender(this);
  }

  addUpdatedListIndex(listIndex: IListIndex): void {
    this.updatedProperties.add(listIndex);
    registerRender(this);
  }

  getUpdatedProperties(): Set<IStatePropertyRef | IListIndex> {
    const updatedProperties = this.updatedProperties;
    this.updatedProperties = new Set();
    return updatedProperties;
  }

  static updatingCount = 0;
}

export function createUpdater(engine: IComponentEngine): IUpdater {
  return new Updater(engine);
}

export function getUpdatingCount(): number {
  return Updater.updatingCount;
}