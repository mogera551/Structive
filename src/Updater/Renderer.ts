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
import { raiseError } from "../utils";
import { IRenderer } from "./types";

class Renderer implements IRenderer {
  #updatedBindings: Set<IBinding> = new Set();
  #trackedRefs: Set<IStatePropertyRef> = new Set();
  #engine: IComponentEngine;
  #readonlyState: IReadonlyStateProxy | null = null;
  #listDiffByRef: Map<IStatePropertyRef, IListDiff> = new Map();

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
  }

  get updatedBindings(): Set<IBinding> {
    return this.#updatedBindings;
  }

  get trackedRefs(): Set<IStatePropertyRef> {
    return this.#trackedRefs;
  }

  get readonlyState(): IReadonlyStateProxy {
    if (!this.#readonlyState) {
      raiseError("ReadonlyState is not initialized.");
    }
    return this.#readonlyState;
  }

  get engine(): IComponentEngine {
    if (!this.#engine) {
      raiseError("Engine is not initialized.");
    }
    return this.#engine;
  }

  render(items: IStatePropertyRef[]): void {
    this.#listDiffByRef.clear();
    this.#trackedRefs.clear();
    this.#updatedBindings.clear();

    // 実際のレンダリングロジックを実装
    const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state, this);
    try {
      readonlyState[SetCacheableSymbol](() => {
        for(let i = 0; i < items.length; i++) {
          const ref = items[i];
          const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
          if (node === null) {
            raiseError(`PathNode not found: ${ref.info.pattern}`);
          }
          this.renderItem(ref, node);
        }
      });

    } finally {
      this.#readonlyState = null;
    }
  }

  calcListDiff(ref: IStatePropertyRef, _newListValue: any[] | undefined | null = undefined, isNewValue: boolean = false): IListDiff {
    let listDiff = this.#listDiffByRef.get(ref);
    if (typeof listDiff === "undefined") {
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
    if (this.trackedRefs.has(ref)) {
      return; // すでに処理済みのRef情報はスキップ
    }
    this.trackedRefs.add(ref);

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
        if (depInfo.wildcardCount > 0) {
          const infos = depInfo.wildcardParentInfos;
          const walk = (info: IStructuredPathInfo, listIndex: IListIndex | null, index: number, nextInfo: IStructuredPathInfo) => {
            const depRef = getStatePropertyRef(info, listIndex);
            const listIndexes = this.#engine.getListIndexes(depRef) || [];
            if ((index + 1) < infos.length) {
              for(let i = 0; i < listIndexes.length; i++) {
                const subListIndex = listIndexes[i];
                walk(nextInfo, subListIndex, index + 1, infos[index + 1]);
              }
            } else {
              for(let i = 0; i < listIndexes.length; i++) {
                const subListIndex = listIndexes[i];
                const depRef = getStatePropertyRef(depInfo, subListIndex);
                const depNode = findPathNodeByPath(this.#engine.pathManager.rootNode, depInfo.pattern);
                if (depNode === null) {
                  raiseError(`PathNode not found: ${depInfo.pattern}`);
                }
                this.renderItem(depRef, depNode);
              }
            }
          }
          walk(depInfo.wildcardParentInfos[0], null, 0, depInfo.wildcardParentInfos[1] || null);
        } else {
          const depRef = getStatePropertyRef(depInfo, null);
          const depNode = findPathNodeByPath(this.#engine.pathManager.rootNode, depInfo.pattern);
          if (depNode === null) {
            raiseError(`PathNode not found: ${depInfo.pattern}`);
          }
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