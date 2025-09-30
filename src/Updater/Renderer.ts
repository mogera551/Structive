import { IComponentEngine } from "../ComponentEngine/types";
import { WILDCARD } from "../constants";
import { IBinding } from "../DataBinding/types";
import { calcListDiff } from "../ListDiff/ListDiff";
import { IListDiff } from "../ListDiff/types";
import { IListIndex } from "../ListIndex/types";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { IPathNode } from "../PathTree/types";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
import { IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { createSwapDiff } from "../SwapDiff/SwapDiff";
import { ISwapDiff } from "../SwapDiff/types";
import { raiseError } from "../utils";
import { IRenderer } from "./types";

class Renderer implements IRenderer {
  #updatedBindings: Set<IBinding> = new Set();
  #processedRefs: Set<IStatePropertyRef> = new Set();
  #engine: IComponentEngine;
  #readonlyState: IReadonlyStateProxy | null = null;
  #listDiffByRef: Map<IStatePropertyRef, IListDiff | null> = new Map();
  #swapDiffByRef: Map<IStatePropertyRef, ISwapDiff> = new Map();

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
  }

  get updatedBindings(): Set<IBinding> {
    return this.#updatedBindings;
  }

  get processedRefs(): Set<IStatePropertyRef> {
    return this.#processedRefs;
  }

  get readonlyState(): IReadonlyStateProxy {
    if (!this.#readonlyState) {
      raiseError({
        code: "UPD-002",
        message: "ReadonlyState not initialized",
        docsUrl: "./docs/error-codes.md#upd",
      });
    }
    return this.#readonlyState;
  }

  get engine(): IComponentEngine {
    if (!this.#engine) {
      raiseError({
        code: "UPD-001",
        message: "Engine not initialized",
        docsUrl: "./docs/error-codes.md#upd",
      });
    }
    return this.#engine;
  }

  render(items: IStatePropertyRef[]): void {
    this.#listDiffByRef.clear();
    this.#processedRefs.clear();
    this.#updatedBindings.clear();
    this.#swapDiffByRef.clear();

    // 実際のレンダリングロジックを実装
    const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state, this);
    try {
      readonlyState[SetCacheableSymbol](() => {
        const listRefs = new Set<IStatePropertyRef>();
        for(let i = 0; i < items.length; i++) {
          const ref = items[i];
          if( this.engine.pathManager.lists.has(ref.info.pattern) ) {
            listRefs.add(ref);
            continue;
          }
          if (!this.engine.pathManager.elements.has(ref.info.pattern)) {
            continue; // elements に登録されていないパスはスキップ
          }
          // リスト要素を処理済みに追加
          this.#processedRefs.add(ref);

          const listIndex = ref.listIndex ?? raiseError({
            code: "UPD-003",
            message: `ListIndex is null for ref: ${ref.key}`,
            context: { refKey: ref.key, pattern: ref.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
          if (ref.info.parentInfo === null) {
            raiseError({
              code: "UPD-004",
              message: `ParentInfo is null for ref: ${ref.key}`,
              context: { refKey: ref.key, pattern: ref.info.pattern },
              docsUrl: "./docs/error-codes.md#upd",
            });
          }
          const listRef = getStatePropertyRef(ref.info.parentInfo, ref.listIndex?.at(-2) || null);
          if (listRefs.has(listRef)) {
            // リストの差分計算は後続のcalcListDiffで行うので、swapのための計算はスキップ
            continue;
          }
          let swapDiff = this.#swapDiffByRef.get(listRef);
          const [ , oldListIndexes, oldListValue ] = this.engine.getListAndListIndexes(listRef);
          if (oldListValue == null || oldListIndexes == null) {
            raiseError({
              code: "UPD-005",
              message: `OldListValue is null for ref: ${listRef.key}`,
              context: { refKey: listRef.key, pattern: listRef.info.pattern },
              docsUrl: "./docs/error-codes.md#upd",
            });
          }
          const elementValue = this.readonlyState[GetByRefSymbol](ref);
          if (typeof swapDiff === "undefined") {
            swapDiff = createSwapDiff();
            swapDiff.oldListValue = oldListValue;
            swapDiff.newListValue = elementValue;
            swapDiff.oldIndexes = oldListIndexes;
            swapDiff.newIndexes = Array.from(swapDiff.oldIndexes);
            this.#swapDiffByRef.set(listRef, swapDiff);
          }
          const oldIndex = oldListValue?.indexOf(elementValue) ?? -1;
          if (oldIndex === -1) {
            swapDiff.overwrites.add(listIndex);
          } else {
            const oldListIndex = oldListIndexes?.[oldIndex] ?? raiseError({
              code: "UPD-004",
              message: `ListIndex not found for value: ${elementValue}`,
              context: { refKey: ref.key, pattern: ref.info.pattern },
              docsUrl: "./docs/error-codes.md#upd",
            });
            oldListIndex.index = listIndex.index; // インデックスを更新
            swapDiff.newIndexes[listIndex.index] = oldListIndex;
            swapDiff.swaps.add(oldListIndex);
          }
        }

        for(const [ ref, swapDiff ] of this.#swapDiffByRef) {
          if (listRefs.has(ref)) {
            // リストの差分計算は後続のcalcListDiffで行うので、ここのswapのための計算はスキップ
            continue;
          }
          const listDiff = {
            oldListValue: swapDiff.oldListValue,
            newListValue: swapDiff.newListValue,
            oldIndexes: swapDiff.oldIndexes,
            newIndexes: swapDiff.newIndexes,
            changeIndexes: swapDiff.swaps,
            overwrites: swapDiff.overwrites,
          };
          this.engine.saveListAndListIndexes(ref, swapDiff.newListValue ?? null, swapDiff.newIndexes);
          this.#listDiffByRef.set(ref, listDiff);
          const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
          if (node === null) {
            raiseError({
              code: "PATH-101",
              message: `PathNode not found: ${ref.info.pattern}`,
              context: { pattern: ref.info.pattern },
              docsUrl: "./docs/error-codes.md#path",
            });
          }
          this.renderItem(ref, node);
        }

        for(let i = 0; i < items.length; i++) {
          const ref = items[i];
          const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
          if (node === null) {
            raiseError({
              code: "PATH-101",
              message: `PathNode not found: ${ref.info.pattern}`,
              context: { pattern: ref.info.pattern },
              docsUrl: "./docs/error-codes.md#path",
            });
          }
          this.renderItem(ref, node);
        }
      });

    } finally {
      this.#readonlyState = null;
    }
  }

  calcListDiff(ref: IStatePropertyRef, _newListValue: any[] | undefined | null = undefined, isNewValue: boolean = false): IListDiff | null {
    let listDiff = this.#listDiffByRef.get(ref);
    if (typeof listDiff === "undefined") {
      this.#listDiffByRef.set(ref, null); // calcListDiff中に再帰的に呼ばれた場合に備えてnullをセットしておく
      const [ oldListValue, oldListIndexes ] = this.engine.getListAndListIndexes(ref);
      let newListValue = isNewValue ? _newListValue : this.readonlyState[GetByRefSymbol](ref);
      listDiff = calcListDiff(ref.listIndex, oldListValue, newListValue, oldListIndexes);
      this.#listDiffByRef.set(ref, listDiff);
      if (oldListValue !== newListValue) {
        this.engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
      }
    }
    return listDiff;
  }

  renderItem(
    ref: IStatePropertyRef,
    node: IPathNode,
  ): void {
    if (this.processedRefs.has(ref)) {
      return; // すでに処理済みのRef情報はスキップ
    }
    this.processedRefs.add(ref);

    // バインディングに変更を適用する
    // 変更があったバインディングはupdatedBindingsに追加する
    const bindings = this.#engine.getBindings(ref);
    for(let i = 0; i < bindings.length; i++) {
      const binding = bindings[i];
      if (this.updatedBindings.has(binding)) {
        continue; // すでに更新済みのバインディングはスキップ
      }
      binding.applyChange(this);
    }

    // 静的な依存関係を辿る
    for(const [ name, childNode ] of node.childNodeByName) {
      const childInfo = getStructuredPathInfo(childNode.currentPath);
      if (name === WILDCARD) {
        const diff = this.calcListDiff(ref);
        if (diff === null) {
          raiseError({
            code: "UPD-006",
            message: "ListDiff is null during renderItem",
            context: { refKey: ref.key, pattern: ref.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
        }
        for(const listIndex of diff.adds ?? []) {
          const childRef = getStatePropertyRef(childInfo, listIndex);
          this.renderItem(childRef, childNode);
        }
      } else {
        const childRef = getStatePropertyRef(childInfo, ref.listIndex);
        this.renderItem(childRef, childNode);
      }
    }

    // 動的な依存関係を辿る
    const deps = this.#engine.pathManager.dynamicDependencies.get(ref.info.pattern);
    if (deps) {
      for(const depPath of deps) {
        const depInfo = getStructuredPathInfo(depPath);
        const depNode = findPathNodeByPath(this.#engine.pathManager.rootNode, depInfo.pattern);
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
          const walk = (depRef: IStatePropertyRef, index: number, nextInfo: IStructuredPathInfo) => {
            const listIndexes = this.#engine.getListIndexes(depRef) || [];
            if ((index + 1) < infos.length) {
              for(let i = 0; i < listIndexes.length; i++) {
                const nextRef = getStatePropertyRef(nextInfo, listIndexes[i]);
                walk(nextRef, index + 1, infos[index + 1]);
              }
            } else {
              for(let i = 0; i < listIndexes.length; i++) {
                const subDepRef = getStatePropertyRef(depInfo, listIndexes[i]);
                this.renderItem(subDepRef, depNode);
              }
            }
          }
          const startRef = getStatePropertyRef(depInfo.wildcardParentInfos[0], null);
          walk(startRef, 0, depInfo.wildcardParentInfos[1] || null);
        } else {
          const depRef = getStatePropertyRef(depInfo, null);
          this.renderItem(depRef, depNode);
        }
      }
    }
  }
}

export function render(refs: IStatePropertyRef[], engine: IComponentEngine): void {
  const renderer = new Renderer(engine);
  renderer.render(refs);
}