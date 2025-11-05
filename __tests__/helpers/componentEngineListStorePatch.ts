import { ComponentEngine } from "../../src/ComponentEngine/ComponentEngine";
import type { IListIndex } from "../../src/ListIndex/types";
import type { IStatePropertyRef } from "../../src/StatePropertyRef/types";

const STORE_SYMBOL = Symbol("structive.componentEngine.saveInfoStore");
const PATCHED_SYMBOL = Symbol("structive.componentEngine.saveInfoPatched");

interface SaveInfo {
  list: any[] | null;
  listIndexes: IListIndex[] | null;
  listClone: any[] | null;
}

const EMPTY_SAVE_INFO: SaveInfo = {
  list: null,
  listIndexes: null,
  listClone: null,
};

function cloneSaveInfo(info: SaveInfo): SaveInfo {
  return {
    list: info.list,
    listIndexes: info.listIndexes,
    listClone: info.listClone,
  };
}

function ensureStore(engine: any): WeakMap<IStatePropertyRef, SaveInfo> {
  if (!engine[STORE_SYMBOL]) {
    engine[STORE_SYMBOL] = new WeakMap<IStatePropertyRef, SaveInfo>();
  }
  return engine[STORE_SYMBOL];
}

(function patchComponentEnginePrototype() {
  const proto = ComponentEngine.prototype as any;
  if (proto[PATCHED_SYMBOL]) {
    return;
  }

  const originalGetListIndexes: ((ref: IStatePropertyRef) => IListIndex[] | null) | undefined = proto.getListIndexes;

  proto.saveListAndListIndexes = function saveListAndListIndexesPatch(
    ref: IStatePropertyRef,
    list: any[] | null,
    listIndexes: IListIndex[] | null,
  ): void {
    if (!this.pathManager?.lists?.has?.(ref.info.pattern)) {
      ensureStore(this).delete(ref);
      return;
    }
    const store = ensureStore(this);
    const record: SaveInfo = {
      list: list ?? null,
      listIndexes: listIndexes ?? null,
      listClone: Array.isArray(list) ? Array.from(list) : null,
    };
    store.set(ref, record);
  };

  proto.getListAndListIndexes = function getListAndListIndexesPatch(ref: IStatePropertyRef): SaveInfo {
    const store = ensureStore(this);
    return cloneSaveInfo(store.get(ref) ?? EMPTY_SAVE_INFO);
  };

  if (typeof originalGetListIndexes === "function") {
    proto.getListIndexes = function getListIndexesPatch(ref: IStatePropertyRef): IListIndex[] | null {
      const store = ensureStore(this);
      const info = store.get(ref);
      if (info?.listIndexes) {
        return info.listIndexes;
      }
      return originalGetListIndexes.call(this, ref);
    };
  }

  Object.defineProperty(proto, PATCHED_SYMBOL, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
})();
