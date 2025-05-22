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

type UpdatedArrayElementBinding = {
  parentRef: IStatePropertyRef;
  binding: IBinding;
  listIndexes: IListIndex[];
  values: any[];
};

class Updater implements IUpdater {
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
    this.entryRender();
  }

  addUpdatedListIndex(listIndex: IListIndex): void {
    this.updatedProperties.add(listIndex);
    this.entryRender();
  }

  #isEntryRender = false;
  entryRender() {
    if (this.#isEntryRender) return;
    this.#isEntryRender = true;
    setTimeout(() => {
      try {
        const { bindings, arrayElementBindings } = this.rebuild();
        // render
        for(const arrayElementBinding of arrayElementBindings) {
          arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
        }
        if (bindings.length > 0) {
          this.render(bindings);
        }
      } finally {
        this.#isEntryRender = false;
      }
    }, 0);
  }

  rebuild(): {bindings: IBinding[], arrayElementBindings: UpdatedArrayElementBinding[]} {
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
}

export function createUpdater(engine: IComponentEngine): IUpdater {
  return new Updater(engine);
}

