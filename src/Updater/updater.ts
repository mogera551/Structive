import { IBinding } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { render } from "../Render/render.js";
import { SetCacheableSymbol } from "../StateClass/symbols.js";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { raiseError } from "../utils.js";
import { getGlobalConfig } from "../WebComponents/getGlobalConfig.js";
import { IUpdater } from "./types";
import { restructListIndexes } from "./restructListIndex";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";

type UpdatedArrayElementBinding = {
  parentRef: IStatePropertyRef;
  binding: IBinding;
  listIndexes: IListIndex[];
  values: any[];
};

class Updater implements IUpdater {
  processList      : (() => Promise<void> | void)[] = [];
  updatedProperties: Set<IStatePropertyRef | IListIndex> = new Set;
  updatedValues    : {[key:string]: any} = {};
  engine           : IComponentEngine;
  #version         : number = 0;

  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  get version(): number {
    return this.#version;
  }

  addProcess(process: () => Promise<void> | void): void {
    this.processList.push(process);
    this.waitForQueueEntry.resolve();
  }

  addUpdatedStatePropertyRefValue(
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    value    : any
  ): void {
    const refKey = createRefKey(info, listIndex);
    this.updatedProperties.add({info, listIndex});
    this.updatedValues[refKey] = value;
    this.waitForQueueEntry.resolve();
  }

  addUpdatedListIndex(listIndex: IListIndex): void {
    this.updatedProperties.add(listIndex);
    this.waitForQueueEntry.resolve();
  }

  terminate(): PromiseWithResolvers<void> {
    const waitForMainLoopTerminate = Promise.withResolvers<void>();
    this.waitForQueueEntry.resolve(waitForMainLoopTerminate);
    return waitForMainLoopTerminate;
  }

  waitForQueueEntry: PromiseWithResolvers<PromiseWithResolvers<void> | void> = 
    Promise.withResolvers<PromiseWithResolvers<void> | void>();
  async main(waitForComponentInit: PromiseWithResolvers<void>) {
    await waitForComponentInit.promise;
    const config = getGlobalConfig();
    while (true) {
      try {
        const waitForMainLoopTerminate: (PromiseWithResolvers<void> | void) = 
          await this.waitForQueueEntry.promise;
          config.debug && performance.mark(`start`);
        Updater.updatingCount++;
        try {
          await this.exec();
          if (config.debug) {
            performance.mark(`end`);
            performance.measure(`exec`, `start`, `end`);
            console.log(performance.getEntriesByType("measure"));    
            performance.clearMeasures(`exec`);
            performance.clearMarks(`start`);
            performance.clearMarks(`end`);
          }
        } finally {
          Updater.updatingCount--;
          if (waitForMainLoopTerminate) {
            waitForMainLoopTerminate.resolve();
            break;
          }
        }
      } catch(e) {
        console.error(e);
      } finally {
        this.waitForQueueEntry = Promise.withResolvers<PromiseWithResolvers<void> | void>();
      }
    }
  }

  async updateState() {
    while(this.processList.length > 0) {
      const processList = this.processList;
      this.processList = [];
      for(let i = 0; i < processList.length; i++) {
        const process = processList[i];
        await process();
      }
    }
  }

  async rebuild(): Promise<{bindings: IBinding[], arrayElementBindings: UpdatedArrayElementBinding[]}> {
    const retArrayElementBindings: UpdatedArrayElementBinding[] = [];
    const retBindings: IBinding[] = [];
    const engine = this.engine;
    while(this.updatedProperties.size > 0) {
      const updatedProiperties = Array.from(this.updatedProperties.values());
      this.updatedProperties.clear();
      const bindingsByListIndex: IBinding[] = [];
      const updatedRefs: IStatePropertyRef[] = []; // 更新されたプロパティ参照のリスト
      const arrayElementBindingByParentRefKey = new Map<string, Partial<UpdatedArrayElementBinding>>();
      for(let i = 0; i < updatedProiperties.length; i++) {
        const item = updatedProiperties[i];
        if ("index" in item) {
          const bindings = engine.bindingsByListIndex.get(item as IListIndex) ?? [];
          bindingsByListIndex.push(...bindings);
        } else {
          updatedRefs.push(item as IStatePropertyRef);
          if (engine.elementInfoSet.has(item.info)) {
            const parentInfo = item.info.parentInfo ?? raiseError("info is null"); // リストのパス情報
            const parentListIndex = item.listIndex?.at(-2) ?? null; // リストのインデックス
            const parentRef = {info: parentInfo, listIndex: parentListIndex};
            const parentRefKey = createRefKey(parentInfo, parentListIndex);
            let info = arrayElementBindingByParentRefKey.get(parentRefKey);
            if (!info) {
              info = {
                parentRef,
                listIndexes: [],
                values: []
              };
              arrayElementBindingByParentRefKey.set(parentRefKey, info);
            }
            const refKey = createRefKey(item.info, item.listIndex);
            const value = this.updatedValues[refKey] ?? null;
            info.values?.push(value);
            info.listIndexes?.push(item.listIndex as IListIndex);
          }
        }
      }
      // リストインデックスの構築
      const builtStatePropertyRefKeySet = new Set<string>();
      const affectedRefs = new Map<IStructuredPathInfo, Set<IListIndex|null>>();
      restructListIndexes(updatedRefs, engine, this.updatedValues, builtStatePropertyRefKeySet, affectedRefs);

      // スワップの場合の情報を構築する
      for(const [parentRefKey, info] of arrayElementBindingByParentRefKey) {
        const parentInfo = info.parentRef?.info ?? raiseError("parentInfo is null");
        const parentListIndex = info.parentRef?.listIndex ?? null;
        const bindings = engine.getBindings(parentInfo, parentListIndex);
        for(const binding of bindings) {
          if (!binding.bindingNode.isFor) {
            continue;
          }
          const bindingInfo = Object.assign({}, info, { binding });
          retArrayElementBindings.push(bindingInfo as UpdatedArrayElementBinding);
        }
      }
      // 影響する全てのバインド情報を取得する
      for(const [ info, listIndexes ] of affectedRefs.entries()) {
        for(const listIndex of listIndexes) {
          const bindings = engine.getBindings(info, listIndex);
          retBindings.push(...bindings ?? []);
        }
      }
      retBindings.push(...bindingsByListIndex);
    }
    this.updatedValues = {};
    return {bindings: retBindings, arrayElementBindings: retArrayElementBindings};
  }

  render(bindings: IBinding[]) {
    this.#version++;
    this.engine.readonlyState[SetCacheableSymbol](() => {
      return render(bindings);
    });
  }

  async exec() {
    while(this.processList.length !== 0 || this.updatedProperties.size !== 0) {
      // update state
      await this.updateState();
      // rebuild
      const { bindings, arrayElementBindings } = await this.rebuild();
      // render
      for(const arrayElementBinding of arrayElementBindings) {
        arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
      }
      if (bindings.length > 0) {
        this.render(bindings);
      }
    }
  }

  static updatingCount = 0;
}

export function createUpdater(engine: IComponentEngine): IUpdater {
  return new Updater(engine);
}

export function getUpdatingCount(): number {
  return Updater.updatingCount;
}