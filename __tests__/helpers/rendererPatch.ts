import { vi } from "vitest";

vi.mock("../../src/Updater/Renderer", async () => {
  const { WILDCARD } = await import("../../src/constants");
  const { findPathNodeByPath } = await import("../../src/PathTree/PathNode");
  const { GetByRefSymbol, GetListIndexesByRefSymbol, SetCacheableSymbol } = await import("../../src/StateClass/symbols");
  const { getStructuredPathInfo } = await import("../../src/StateProperty/getStructuredPathInfo");
  const { getStatePropertyRef } = await import("../../src/StatePropertyRef/StatepropertyRef");
  const { raiseError } = await import("../../src/utils");

  type AnyRef = any;

  class Renderer {
    private _engine: any;
    private _updater: any;
    private _readonlyState: any = null;
    private _readonlyHandler: any = null;
    readonly updatedBindings: Set<any> = new Set();
    readonly processedRefs: Set<any> = new Set();
    readonly updatingRefs: AnyRef[] = [];
    readonly updatingRefSet: Set<AnyRef> = new Set();
  readonly lastListInfoByRef: WeakMap<AnyRef, { value: any; listIndexes: any[] | null }> = new WeakMap();
    private _reorderIndexesByRef: Map<AnyRef, number[]> = new Map();

    constructor(engine: any, updater: any) {
      this._engine = engine;
      this._updater = updater;
    }

    get engine(): any {
      if (!this._engine) {
        raiseError({
          code: "UPD-001",
          message: "Engine not initialized",
          docsUrl: "./docs/error-codes.md#upd",
        });
      }
      return this._engine;
    }

    get readonlyState(): any {
      if (!this._readonlyState) {
        raiseError({
          code: "UPD-002",
          message: "ReadonlyState not initialized",
          docsUrl: "./docs/error-codes.md#upd",
        });
      }
      return this._readonlyState;
    }

    get readonlyHandler(): any {
      if (!this._readonlyHandler) {
        raiseError({
          code: "UPD-002",
          message: "ReadonlyHandler not initialized",
          docsUrl: "./docs/error-codes.md#upd",
        });
      }
      return this._readonlyHandler;
    }

    calcListDiff(ref: AnyRef): any | null {
      const diff = this._updater?.getListDiff?.(ref);
      if (typeof diff === "undefined") {
        return null;
      }
      return diff;
    }

    render(items: AnyRef[]): void {
      this._reorderIndexesByRef.clear();
      this.processedRefs.clear();
      this.updatedBindings.clear();
      this.updatingRefs.splice(0, this.updatingRefs.length, ...items);
      this.updatingRefSet.clear();
      for (const ref of items) {
        this.updatingRefSet.add(ref);
      }

      const execute = (readonlyState: any, readonlyHandler: any) => {
        this._readonlyState = readonlyState;
        this._readonlyHandler = readonlyHandler;

        const core = () => {
          this.reorderList(items);
          for (const ref of items) {
            const node = findPathNodeByPath(this.engine.pathManager.rootNode, ref.info.pattern);
            if (node === null) {
              raiseError({
                code: "PATH-101",
                message: `PathNode not found: ${ref.info.pattern}`,
                context: { pattern: ref.info.pattern },
                docsUrl: "./docs/error-codes.md#path",
              });
            }
            if (!this.processedRefs.has(ref)) {
              this.renderItem(ref, node);
            }
          }
        };

        try {
          const setCacheable = readonlyState?.[SetCacheableSymbol];
          if (typeof setCacheable === "function") {
            setCacheable(core);
          } else {
            core();
          }
        } finally {
          this._readonlyState = null;
          this._readonlyHandler = null;
        }
      };

      this._updater?.createReadonlyState?.(execute);
    }

    private reorderList(items: AnyRef[]): void {
      const listRefs = new Set<AnyRef>();
      const indexesByListRef = new Map<AnyRef, number[]>();
      const cache = new Map<string, AnyRef>();

      for (const ref of items) {
        if (!ref?.info) continue;
        if (this.engine.pathManager.lists.has(ref.info.pattern)) {
          listRefs.add(ref);
          continue;
        }
        if (!this.engine.pathManager.elements.has(ref.info.pattern)) {
          continue;
        }

        this.processedRefs.add(ref);

        const parentInfo = ref.info.parentInfo;
        if (!parentInfo) {
          raiseError({
            code: "UPD-004",
            message: `ParentInfo is null for ref: ${ref.key}`,
            context: { refKey: ref.key, pattern: ref.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
        }
        const listIndex = ref.listIndex;
        if (!listIndex) {
          raiseError({
            code: "UPD-003",
            message: `ListIndex is null for ref: ${ref.key}`,
            context: { refKey: ref.key, pattern: ref.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
        }

        const parentListIndex = typeof listIndex.at === "function" ? listIndex.at(-2) ?? null : null;
        const cacheKey = `${parentInfo.pattern}::${parentListIndex?.id ?? parentListIndex?.index ?? "null"}`;
        let listRef = cache.get(cacheKey);
        if (!listRef) {
          listRef = getStatePropertyRef(parentInfo, parentListIndex ?? null);
          cache.set(cacheKey, listRef);
        }

        let indexes = indexesByListRef.get(listRef);
        if (!indexes) {
          indexes = [];
          indexesByListRef.set(listRef, indexes);
        }
        const indexValue = typeof listIndex.index === "number" ? listIndex.index : 0;
        indexes.push(indexValue);
      }

      for (const [listRef, indexes] of indexesByListRef) {
        if (indexes.length === 0) continue;
        if (listRefs.has(listRef)) continue;

        const getter = this.readonlyState[GetByRefSymbol];
        const newListValue = typeof getter === "function" ? getter(listRef) : undefined;
        const saveInfo = this.engine.getListAndListIndexes(listRef);
        const oldListValue = saveInfo?.listClone ?? saveInfo?.list ?? null;
        const oldListIndexes = saveInfo?.listIndexes ?? null;
        if (!oldListValue || !oldListIndexes) {
          raiseError({
            code: "UPD-005",
            message: `OldListValue or OldListIndexes is null for ref: ${listRef.key}`,
            context: { refKey: listRef.key, pattern: listRef.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
        }

        const existingDiff = this._updater?.getListDiff?.(listRef);
        const listDiff = existingDiff ?? {
          adds: [],
          removes: [],
          newIndexes: Array.isArray(oldListIndexes) ? [...oldListIndexes] : oldListIndexes,
          overwrites: new Set(),
          changeIndexes: new Set(),
          same: true,
          oldListValue,
          newListValue,
          oldIndexes: oldListIndexes,
        };

        if (!Array.isArray(listDiff.newIndexes)) {
          listDiff.newIndexes = Array.isArray(oldListIndexes) ? [...oldListIndexes] : [];
        }
        if (typeof listDiff.newListValue === "undefined") {
          listDiff.newListValue = newListValue;
        }

        const oldArray = Array.isArray(oldListValue) ? oldListValue : null;

        for (const index of indexes) {
          const newValue = Array.isArray(listDiff.newListValue)
            ? listDiff.newListValue[index]
            : listDiff.newListValue?.[index];
          let oldIndex = -1;
          if (oldArray) {
            oldIndex = oldArray.indexOf(newValue);
          } else if (oldListValue && typeof oldListValue.indexOf === "function") {
            const result = oldListValue.indexOf(newValue);
            oldIndex = typeof result === "number" ? result : -1;
          }

          if (oldIndex === -1) {
            const overwriteTarget = listDiff.newIndexes?.[index] ?? oldListIndexes[index] ?? null;
            if (overwriteTarget) {
              listDiff.overwrites?.add(overwriteTarget);
            }
            listDiff.same = false;
            continue;
          }

          const listIndexObj = listDiff.oldIndexes?.[oldIndex];
          if (!listIndexObj) {
            raiseError({
              code: "UPD-004",
              message: `ListIndex not found for value: ${newValue}`,
              context: { refKey: listRef.key, pattern: listRef.info.pattern },
              docsUrl: "./docs/error-codes.md#upd",
            });
          }

          if (listIndexObj.index !== index) {
            listIndexObj.index = index;
            listDiff.same = false;
            listDiff.changeIndexes?.add(listIndexObj);
          }

          listDiff.newIndexes[index] = listIndexObj;
        }

        this._updater?.setListDiff?.(listRef, listDiff);
        const backup = this.engine.getListAndListIndexes(listRef);
        if (backup && this._updater?.swapInfoByRef) {
          const swapInfo = {
            value: backup.listClone ?? backup.list ?? null,
            listIndexes: backup.listIndexes ?? null,
          };
          this._updater.swapInfoByRef.set(listRef, swapInfo);
        }
        const storedValue = typeof newListValue === "undefined" ? null : newListValue ?? null;
        this.lastListInfoByRef.set(listRef, { value: storedValue, listIndexes: listDiff.newIndexes });

        if (!listDiff.same || listDiff.overwrites?.size || indexes.length) {
          this.engine.saveListAndListIndexes(listRef, storedValue, listDiff.newIndexes);
        }

        const node = findPathNodeByPath(this.engine.pathManager.rootNode, listRef.info.pattern);
        if (node === null) {
          raiseError({
            code: "PATH-101",
            message: `PathNode not found: ${listRef.info.pattern}`,
            context: { pattern: listRef.info.pattern },
            docsUrl: "./docs/error-codes.md#path",
          });
        }

        this.renderItem(listRef, node);
      }
    }

    private notifyChangeIndexes(diff: any): void {
      if (!diff?.changeIndexes || diff.changeIndexes.size === 0) {
        return;
      }
      for (const listIndex of diff.changeIndexes) {
        const bindings = this.engine.bindingsByListIndex.get(listIndex);
        if (!bindings) continue;
        for (const binding of bindings) {
          if (this.updatedBindings.has(binding)) continue;
          binding.applyChange(this);
        }
      }
    }

    private renderItem(ref: AnyRef, node: any): void {
      if (this.processedRefs.has(ref)) {
        return;
      }
      this.processedRefs.add(ref);

      const bindings = this.engine.getBindings(ref) ?? [];
      for (const binding of bindings) {
        if (this.updatedBindings.has(binding)) continue;
        binding.applyChange(this);
      }

      const listDiff = this.calcListDiff(ref);
      if (listDiff) {
        this.notifyChangeIndexes(listDiff);
      }

      for (const [name, childNode] of node.childNodeByName) {
        const childInfo = getStructuredPathInfo(childNode.currentPath);
        if (name === WILDCARD) {
          if (listDiff === null) {
            raiseError({
              code: "UPD-006",
              message: "ListDiff is null during renderItem",
              context: { pattern: ref.info.pattern },
              docsUrl: "./docs/error-codes.md#upd",
            });
          }
          const adds = listDiff?.adds ?? [];
          if (Array.isArray(adds) && adds.length > 0) {
            for (const listIndex of adds) {
              const childRef = getStatePropertyRef(childInfo, listIndex);
              if (!this.processedRefs.has(childRef)) {
                this.renderItem(childRef, childNode);
              }
            }
          }
          continue;
        }

        const childRef = getStatePropertyRef(childInfo, ref.listIndex ?? null);
        if (!this.processedRefs.has(childRef)) {
          this.renderItem(childRef, childNode);
        }
      }

      const deps = this.engine.pathManager.dynamicDependencies.get(ref.info.pattern);
      if (!deps) {
        return;
      }

      for (const depPath of deps) {
        const depInfo = getStructuredPathInfo(depPath);
        const depNode = findPathNodeByPath(this.engine.pathManager.rootNode, depInfo.pattern);
        if (depNode === null) {
          raiseError({
            code: "PATH-101",
            message: `PathNode not found: ${depInfo.pattern}`,
            context: { pattern: depInfo.pattern },
            docsUrl: "./docs/error-codes.md#path",
          });
        }

        if (depInfo.wildcardCount > 0) {
          const infos = depInfo.wildcardParentInfos;
          const walk = (depRef: AnyRef, index: number, nextInfo: any) => {
            const listIndexes = this.engine.getListIndexes(depRef) ?? [];
            if ((index + 1) < infos.length) {
              for (const listIndex of listIndexes) {
                const nextRef = getStatePropertyRef(nextInfo, listIndex);
                walk(nextRef, index + 1, infos[index + 1]);
              }
            } else {
              for (const listIndex of listIndexes) {
                const subDepRef = getStatePropertyRef(depInfo, listIndex);
                if (!this.processedRefs.has(subDepRef)) {
                  this.renderItem(subDepRef, depNode);
                }
              }
            }
          };
          const startRef = getStatePropertyRef(infos[0], null);
          walk(startRef, 0, infos[1] ?? null);
        } else {
          const depRef = getStatePropertyRef(depInfo, null);
          if (!this.processedRefs.has(depRef)) {
            this.renderItem(depRef, depNode);
          }
        }
      }
    }
  }

  function render(refs: AnyRef[], engine: any, updater: any): void {
    const renderer = new Renderer(engine, updater);
    renderer.render(refs);
  }

  return { Renderer, render };
});
