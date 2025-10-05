import { IComponentEngine } from "../ComponentEngine/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { IListIndex } from "../ListIndex/types";
import { raiseError } from "../utils";
import { calcListDiff } from "../ListDiff/ListDiff";
import { IPropertyAccessor, IUpdateContext, IUpdater } from "./types";
import { IListDiff } from "../ListDiff/types";
import { IReadonlyStateProxy, IStateProxy, IWritableStateProxy } from "../StateClass/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAccessorSymbol, GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
import { ICacheEntry } from "../Cache/types";
import { IBinding } from "../DataBinding/types";

class UpdateContext implements IUpdateContext {
  #version: number;
  #engine: IComponentEngine;
  #updater: IUpdater;
  #listDiffByRef: Map<IStatePropertyRef, IListDiff> = new Map();
  #stackRefsForCalcListDiff: Set<IStatePropertyRef> = new Set();

  constructor(engine: IComponentEngine, updater: IUpdater, version: number) {
    this.#engine = engine;
    this.#updater = updater;
    this.#version = version;
  }

  getCacheEntry(ref: IStatePropertyRef): ICacheEntry {
    return this.#engine.getCacheEntry(ref) ?? raiseError({
      code: 'CACHE-201',
      message: 'cacheEntry is null',
      context: { where: 'PropertyAccessor.getCacheEntry', refPath: ref.info.pattern },
      docsUrl: '/docs/error-codes.md#cache',
    });
  }

  updateOnDirty(state: IStateProxy, cacheEntry: ICacheEntry,  ref: IStatePropertyRef): any {
    // キャッシュが古い場合は、最新の値を取得してキャッシュを更新
    const value = state[GetByRefSymbol](ref);
    cacheEntry.setValue(value, this.#version);
    if (this.#engine.pathManager.lists.has(ref.info.pattern)) {
      this.calcListDiff(state, ref);
    }
    return value;
  }

  getValue(state: IStateProxy, ref: IStatePropertyRef): any {
    const cacheEntry = this.getCacheEntry(ref);
    if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
      this.updateOnDirty(state, cacheEntry, ref);
    }
    return cacheEntry.value;
  }

  forceUpdateCache(state: IStateProxy, ref: IStatePropertyRef): void {
    // 強制的にキャッシュを更新
    const cacheEntry = this.getCacheEntry(ref);
    this.updateOnDirty(state, cacheEntry, ref);
  }

  setValue(state: IWritableStateProxy, ref: IStatePropertyRef, value: any): void {
    try {
      state[SetByRefSymbol](ref, value);
      const cacheEntry = this.getCacheEntry(ref);
      cacheEntry.setValue(value, this.#version);
    } finally {
      this.#updater.enqueueRef(ref);
    }
  }

  getListIndexes(state: IStateProxy, ref: IStatePropertyRef): IListIndex[] | null {
    const cacheEntry = this.getCacheEntry(ref);
    if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
      this.updateOnDirty(state, cacheEntry, ref);
    }
    return this.#engine.getListIndexes(ref);
  }

  getListAndIndexes(state: IStateProxy, ref: IStatePropertyRef): [ any[] | null, IListIndex[] | null, any[] | null ] {
    const cacheEntry = this.getCacheEntry(ref);
    if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
      this.updateOnDirty(state, cacheEntry, ref);
    }
    return this.#engine.getListAndListIndexes(ref);
  }

  getBindings(state: IStateProxy, ref: IStatePropertyRef): IBinding[] {
    const cacheEntry = this.getCacheEntry(ref);
    if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
      this.updateOnDirty(state, cacheEntry, ref);
    }
    return this.#engine.getBindings(ref);
  }

  calcListDiff(state: IStateProxy, ref: IStatePropertyRef): IListDiff | null {
    if (this.#stackRefsForCalcListDiff.has(ref)) {
      console.warn('Circular reference detected in calcListDiff:', Array.from(this.#stackRefsForCalcListDiff).map(r => r.key));
      return null;
    }
    this.#stackRefsForCalcListDiff.add(ref);
    try {
      let listDiff = this.#listDiffByRef.get(ref);
      const newListValue = this.getValue(state, ref);
      if (typeof listDiff === "undefined") {
        const [ oldListValue, oldListIndexes ] = this.#engine.getListAndListIndexes(ref);
        listDiff = calcListDiff(ref.listIndex, oldListValue, newListValue, oldListIndexes);
        this.#listDiffByRef.set(ref, listDiff);
        if (oldListValue !== newListValue) {
          this.#engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
        }
      } else {
        if (listDiff.newListValue !== newListValue) {
          listDiff = calcListDiff(ref.listIndex, listDiff.oldListValue, newListValue, listDiff.oldIndexes);
          this.#listDiffByRef.set(ref, listDiff);
          this.#engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
        }
      }
      return listDiff;
    } finally {
      this.#stackRefsForCalcListDiff.delete(ref);
    }
  }

  getListDiff(ref: IStatePropertyRef): IListDiff | null {
    return this.#listDiffByRef.get(ref) ?? null;
  }

}

export function createUpdateContext(
  engine: IComponentEngine, 
  updater: IUpdater,
  version: number
): IUpdateContext {
  return new UpdateContext(engine, updater, version);
}

class PropertyAccessor implements IPropertyAccessor {
  #state: IStateProxy;
  #context: IUpdateContext;

  constructor(state: IStateProxy, context: IUpdateContext) {
    this.#state = state;
    this.#context = context;
  }

  getValue(ref: IStatePropertyRef): any {
    return this.#context.getValue(this.#state, ref);
  }

  forceUpdateCache(ref: IStatePropertyRef): void {
    this.#context.forceUpdateCache(this.#state, ref);
  }

  setValue(ref: IStatePropertyRef, value: any): void {
    if (!(SetByRefSymbol in this.#state)) {
      raiseError({
        code: "PROP-001",
        message: "State is not writable",
        docsUrl: "./docs/error-codes.md#prop",
      });
    }
    this.#context.setValue(this.#state, ref, value);
  }

  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null {
    return this.#context.getListIndexes(this.#state, ref);
  }

  getListAndIndexes(ref: IStatePropertyRef): [ any[] | null, IListIndex[] | null, any[] | null ] {
    return this.#context.getListAndIndexes(this.#state, ref);
  }

  getBindings(ref: IStatePropertyRef): IBinding[] {
    return this.#context.getBindings(this.#state, ref);
  }

  calcListDiff(ref: IStatePropertyRef): IListDiff | null {
    return this.#context.calcListDiff(this.#state, ref);
  }

  getListDiff(ref: IStatePropertyRef): IListDiff | null {
    return this.#context.getListDiff(ref);
  }

  async connectedCallback(): Promise<void> {
    if (!(ConnectedCallbackSymbol in this.#state)) {
      raiseError({
        code: "PROP-002",
        message: "State does not support connectedCallback",
        docsUrl: "./docs/error-codes.md#prop",
      });
    }
    return await this.#state[ConnectedCallbackSymbol]();
  }

  async disconnectedCallback(): Promise<void> {
    if (!(DisconnectedCallbackSymbol in this.#state)) {
      raiseError({
        code: "PROP-003",
        message: "State does not support disconnectedCallback",
        docsUrl: "./docs/error-codes.md#prop",
      });
    }
    return await this.#state[DisconnectedCallbackSymbol]();
  }

  get state(): IStateProxy {
    return this.#state;
  }
}

export function createPropertyAccessor(state: IStateProxy, context: IUpdateContext): IPropertyAccessor {
  return new PropertyAccessor(state, context);
}