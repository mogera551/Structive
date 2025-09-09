import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { IListIndex2 } from "../ListIndex2/types";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
import { set } from "../StateClass/traps/set";
import { IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { getListDiffResults } from "./getListDiffResults";
import { IListDiffResults, IRenderer, IUpdateInfo } from "./types";

class Renderer implements IRenderer {
  #updatedBindings: Set<IBinding> = new Set();
  #trackedRefKeys: Set<string> = new Set();
  #listDiffResultsByRefKey: Map<string, IListDiffResults> = new Map();
  #engine: IComponentEngine;
  #readonlyState: IReadonlyStateProxy | null = null;

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
  }

  get updatedBindings(): Set<IBinding> {
    return this.#updatedBindings;
  }

  get trackedRefKeys(): Set<string> {
    return this.#trackedRefKeys;
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

  render(items: IUpdateInfo[]): void {
    // 実際のレンダリングロジックを実装
    const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this, this.#engine.state);
    try {
      readonlyState[SetCacheableSymbol](() => {
        for(const item of items) {
          this.renderItem(item.info, item.listIndex, this.trackedRefKeys, this.updatedBindings, readonlyState);
        }
      });

    } finally {
      this.#readonlyState = null;
      this.#listDiffResultsByRefKey.clear();
      this.#trackedRefKeys.clear();
      this.#updatedBindings.clear();
    }
  }

  createListDiffResults(info: IStructuredPathInfo, listIndex: IListIndex2 | null): IListDiffResults {
    if (this.isListValue(info) === false) {
      raiseError("The specified info is not a list value.");
    }
    const refKey = createRefKey(info, listIndex);
    let listDiffResults = this.#listDiffResultsByRefKey.get(refKey);
    if (!listDiffResults) {
      const newValue = this.readonlyState[GetByRefSymbol](info, listIndex);
      const oldValue = this.getOldValue(info, listIndex);
      const oldListIndexesSet = this.getOldListIndexesSet(info, listIndex);
      listDiffResults = getListDiffResults(oldValue, oldListIndexesSet, newValue, listIndex);
      this.#listDiffResultsByRefKey.set(refKey, listDiffResults);
      /**
       * ToDo: undefinedの場合の扱いをどうするか検討
       * - 現状はundefinedを空配列として扱う
       */
      this.setOldValue(info, listIndex, newValue ?? []);
      /**
       * ToDo: undefinedの扱いをどうするか検討
       * - 現状はundefinedを空Setとして扱う
       */
      this.setOldListIndexesSet(info, listIndex, listDiffResults.newListIndexesSet ?? new Set());
    }
    return listDiffResults;
  }

  isListValue(info: IStructuredPathInfo): boolean {
    return this.engine.pathManager.lists.has(info.pattern);
  }

  getOldListIndexesSet(info: IStructuredPathInfo, listIndex: IListIndex2 | null): Set<IListIndex2> | null {
    // 仮実装、実際にはエンジンから古いリストインデックスセットを取得
    return this.engine.getListIndexesSet(info, listIndex) ?? null;
  }

  setOldListIndexesSet(info: IStructuredPathInfo, listIndex: IListIndex2 | null, listIndexesSet: Set<IListIndex2>): void {
    // 仮実装、実際にはエンジンに古いリストインデックスセットを保存
    this.engine.saveListIndexesSet(info, listIndex, listIndexesSet);
  }

  getOldValue(info: IStructuredPathInfo, listIndex: IListIndex2 | null): any[] | null {
    // 仮実装、実際にはエンジンから古い値を取得
    return this.engine.getList(info, listIndex) ?? null;
  }

  setOldValue(info: IStructuredPathInfo, listIndex: IListIndex2 | null, value: any[]): void {
    // 仮実装、実際にはエンジンに古い値を保存
  }

  getBindings(info: IStructuredPathInfo, listIndex: IListIndex2 | null): Set<IBinding> {
    // 仮実装、実際にはエンジンからバインディングを取得
    return new Set<IBinding>();
  }

  renderItem(
    info: IStructuredPathInfo, 
    listIndex: IListIndex2 | null, 
    trackedRefKeys: Set<string>,
    updatedBindings: Set<IBinding>, 
    readonlyState: IReadonlyStateProxy
  ): void {
    const refKey = createRefKey(info, listIndex);
    if (trackedRefKeys.has(refKey)) {
      return; // すでに処理済みのRef情報はスキップ
    }
    trackedRefKeys.add(refKey);

    // バインディングに変更を適用する
    // 変更があったバインディングはupdatedBindingsに追加する
    const bindings = this.getBindings(info, listIndex);
    for(const binding of bindings) {
      if (updatedBindings.has(binding)) {
        continue; // すでに更新済みのバインディングはスキップ
      }
      binding.applyChange(this);
    }
    const isList = this.isListValue(info);
    const diffResults = isList ? this.createListDiffResults(info, listIndex) : null;
    const elementPath = isList ? info.pattern + ".*" : null;
    // 静的依存要素のレンダリング
    for(const subPath of this.#engine?.pathManager.staticDependencies.get(info.pattern) ?? []) {
      const subInfo = getStructuredPathInfo(subPath);
      if (elementPath && subInfo.wildcardPathSet.has(elementPath)) {
        // リストの依存要素の場合
        for(const subListIndex of diffResults?.newListIndexesSet ?? []) {
          this.renderItem(subInfo, subListIndex, trackedRefKeys, updatedBindings, readonlyState);
        }
      } else {
        this.renderItem(subInfo, listIndex, trackedRefKeys, updatedBindings, readonlyState);
      }
    }
    // 動的依存要素のレンダリング
    for(const subPath of this.#engine?.pathManager.dynamicDependencies.get(info.pattern) ?? []) {
      const subInfo = getStructuredPathInfo(subPath);
      if (elementPath && subInfo.wildcardPathSet.has(elementPath)) {
        // リストの依存要素の場合
        for(const subListIndex of diffResults?.newListIndexesSet ?? []) {
          this.renderItem(subInfo, subListIndex, trackedRefKeys, updatedBindings, readonlyState);
        }
      } else {
        if (subInfo.wildcardPathSet.has(info.pattern)) {
          const pathSets = subInfo.wildcardPathSet.intersection(info.wildcardPathSet);
          const subListIndex = listIndex?.at(pathSets.size - 1) ?? null;
          this.renderItem(subInfo, subListIndex, trackedRefKeys, updatedBindings, readonlyState);
        } else {
          this.renderItem(subInfo, null, trackedRefKeys, updatedBindings, readonlyState);
        }
      }
    }
  }
}

export function render(items: IUpdateInfo[], engine: IComponentEngine): void {
  const renderer = new Renderer(engine);
  renderer.render(items);
}