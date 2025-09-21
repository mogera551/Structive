import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { listWalker } from "../ListWalker/listWalker";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
import { IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
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
    const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state);
    try {
      readonlyState[SetCacheableSymbol](() => {
        // リストの差分計算実行
        const listRefByKey: Map<string, IStatePropertyRef> = new Map();
        const elementRefByKey: Map<string, IStatePropertyRef> = new Map();
        const updatingItems: Map<string, IStatePropertyRef> = new Map();
        for(let i = 0; i < items.length; i++) {
          const { info, listIndex, value } = items[i];
          const refKey = createRefKey(info, listIndex);
          this.updateListIndex(info, listIndex, true, listRefByKey, elementRefByKey);
          updatingItems.set(refKey, {info, listIndex});
        }
        for(const [refKey, item] of listRefByKey.entries()) {
          const {info, listIndex} = item;
          updatingItems.set(refKey, {info, listIndex});
        }

        // 各Ref情報に対してレンダリングを実行
        // trackedRefKeysに追加されているRef情報はスキップ
        // updatedBindingsに追加されているバインディングはスキップ
        for(const [refKey, item] of updatingItems.entries()) {
          if (elementRefByKey.has(refKey)) {
            continue; // 要素Ref情報はlistRefByKeyで処理されるためスキップ
          }
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

  getListDiffResults(info: IStructuredPathInfo, listIndex: IListIndex | null): IListDiffResults {
    if (this.isListValue(info) === false) {
      raiseError("The specified info is not a list value.");
    }
    const refKey = createRefKey(info, listIndex);
    let listDiffResults = this.#listDiffResultsByRefKey.get(refKey);
    if (!listDiffResults) {
      const newValue = this.readonlyState[GetByRefSymbol](info, listIndex);
      const oldValue = this.getOldValue(info, listIndex);
      const oldListIndexesSet = new Set(this.getOldListIndexes(info, listIndex));
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
      this.setOldListIndexes(info, listIndex, Array.from(listDiffResults.newListIndexesSet ?? new Set()));
    }
    return listDiffResults;
  }

  isListValue(info: IStructuredPathInfo): boolean {
    return this.engine.pathManager.lists.has(info.pattern);
  }

  getOldListIndexes(info: IStructuredPathInfo, listIndex: IListIndex | null): IListIndex[] | null {
    // エンジンから古いリストインデックスセットを取得
    return this.engine.getListIndexes(info, listIndex) ?? null;
  }

  setOldListIndexes(info: IStructuredPathInfo, listIndex: IListIndex | null, listIndexes: IListIndex[]): void {
    // エンジンに古いリストインデックスセットを保存
    this.engine.saveListIndexes(info, listIndex, listIndexes);
  }

  getOldValue(info: IStructuredPathInfo, listIndex: IListIndex | null): any[] | null {
    // エンジンから古い値を取得
    return this.engine.getList(info, listIndex) ?? null;
  }

  setOldValue(info: IStructuredPathInfo, listIndex: IListIndex | null, value: any[]): void {
    // エンジンに古い値を保存
    this.engine.saveList(info, listIndex, Array.from(value));
  }

  getBindings(info: IStructuredPathInfo, listIndex: IListIndex | null): IBinding[] {
    // エンジンからバインディングを取得
    return this.engine.getBindings(info, listIndex) ?? [];
  }

  updateListIndex(
    info: IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    isDirect: boolean,
    listRefByKey: Map<string, IStatePropertyRef>,
    elementRefByKey: Map<string, IStatePropertyRef>,
    traceRefKeys: Set<string> = new Set()
  ): void {
    const refKey = createRefKey(info, listIndex);
    if (traceRefKeys.has(refKey)) {
      return; // 無限ループ防止
    }
    traceRefKeys.add(refKey);
    const elementInfo = this.isListValue(info) ? getStructuredPathInfo(info.pattern + ".*") : null;
    let diffResults: IListDiffResults | null = null;
    if (this.engine.pathManager.lists.has(info.pattern)) {
      diffResults = this.getListDiffResults(info, listIndex);
      diffResults.onlySwap = false;
      listRefByKey.set(refKey, {info, listIndex});
    } else if (this.engine.pathManager.elements.has(info.pattern) && isDirect) {
      if (!listIndex) {
        raiseError(`Renderer.render: listIndex is null for element ${info.pattern}`);
      }
      const listInfo = info.parentInfo;
      if (!listInfo) {
        raiseError(`Renderer.render: parentInfo is not found for element ${info.pattern}`);
      }
      const listListIndex = listInfo.wildcardCount < info.wildcardCount ? listIndex?.at(-2) ?? null : listIndex;
      const value = this.readonlyState[GetByRefSymbol](info, listIndex);
      diffResults = this.updateElements(info, listIndex, value, listInfo, listListIndex);
      const listRefKey = createRefKey(listInfo, listListIndex);
      listRefByKey.set(listRefKey, {info: listInfo, listIndex: listListIndex});
      elementRefByKey.set(refKey, {info, listIndex});
      // 依存関係
    }

    // 静的依存要素のリストインデックス更新
    for(const subPath of this.#engine?.pathManager.staticDependencies.get(info.pattern) ?? []) {
      const subInfo = getStructuredPathInfo(subPath);
      if (elementInfo?.pattern && subInfo.wildcardPathSet.has(elementInfo.pattern)) {
        // リストの依存要素の場合
        for(const subListIndex of diffResults?.newListIndexesSet ?? []) {
          this.updateListIndex(subInfo, subListIndex, false, listRefByKey, elementRefByKey, traceRefKeys);
        }
      } else {
        this.updateListIndex(subInfo, listIndex, false, listRefByKey, elementRefByKey, traceRefKeys);
      }
    }

    // 動的依存要素のレンダリング
    for(const subPath of this.#engine?.pathManager.dynamicDependencies.get(info.pattern) ?? []) {
      const subInfo = getStructuredPathInfo(subPath);
      // リストの依存要素の場合は、静的依存で処理済み
      if (subInfo.wildcardCount > 0) {
        const parentMatchPaths = subInfo.wildcardPathSet.intersection(elementInfo?.wildcardPathSet ?? new Set());
        if (parentMatchPaths.size > 0) {
          if (diffResults?.newListIndexesSet?.size === parentMatchPaths.size) {
            // リストパスが完全に一致する場合
            for(const subListIndex of diffResults?.newListIndexesSet ?? []) {
              listWalker(this.engine, subInfo, subListIndex, (_info, _listIndex) => {
                this.updateListIndex(_info, _listIndex, false, listRefByKey, elementRefByKey, traceRefKeys);
              });
            }
          } else {
            // リストパスが一部一致する場合
            const lastMatchPath = Array.from(parentMatchPaths).at(-1) as string; // 共通パスを取得
            const lastMatchInfo = getStructuredPathInfo(lastMatchPath); // ワイルドカードのパス情報を取得
            // 共通パスのワイルドカードの深さまでlistIndexを辿る
            const subListIndex = listIndex?.at(lastMatchInfo.wildcardCount - 1) ?? null;
            listWalker(this.engine, subInfo, subListIndex, (_info, _listIndex) => {
              this.updateListIndex(_info, _listIndex, false, listRefByKey, elementRefByKey, traceRefKeys);
            });
          }
        } else {
          // まったく無関係なリストの場合リストを展開しながらレンダリング
          listWalker(this.engine, subInfo, null, (subInfo, subListIndex) => {
            this.updateListIndex(subInfo, subListIndex, false, listRefByKey, elementRefByKey, traceRefKeys);
          });
        }

      } else {
        this.updateListIndex(subInfo, null, false, listRefByKey, elementRefByKey, traceRefKeys);
      }
    }

  }
/*
  updateListIndexes(
    info: IStructuredPathInfo, 
    listIndex: IListIndex | null, 
  ) {
    const diffResult = this.getListDiffResults(info, listIndex);
    diffResult.onlySwap = false;
    for(const path of this.engine.pathManager.lists) {
      const pathInfo = getStructuredPathInfo(path);
      const wildcardInfo = pathInfo.wildcardParentInfos.at(-2);
      if (typeof wildcardInfo === "undefined" || wildcardInfo !== info) {
        continue;
      }
      for(const subListIndex of diffResult.adds ?? []) {
        this.updateListIndexes(pathInfo, subListIndex);
      }
    }
  }
*/
  updateElements(
    info: IStructuredPathInfo, 
    listIndex: IListIndex,
    value: any[] | undefined | null,
    listInfo: IStructuredPathInfo,
    listListIndex: IListIndex | null = null,
  ): IListDiffResults {
    const diffResult = this.getListDiffResults(listInfo, listListIndex);
    const elementValue = value;
    const elementIndex = listIndex;
    const oldValueIndexOf = diffResult.oldValue.indexOf(elementValue);
    if (oldValueIndexOf === -1) {
      // 値が見つからない場合は置き換え扱いにする
      diffResult.replaces = diffResult.replaces ? diffResult.replaces.add(elementIndex) : new Set([elementIndex]);
    } else {
      const swapTarget = new Set([elementIndex]);
      if (swapTarget) {
        diffResult.swapTargets = diffResult.swapTargets ? diffResult.swapTargets.union(swapTarget) : swapTarget;
        diffResult.updates = diffResult.updates ? diffResult.updates.union(swapTarget) : new Set(swapTarget);
      }
    }
    return diffResult;
  }
  renderItem(
    info: IStructuredPathInfo, 
    listIndex: IListIndex | null, 
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
    for(let i = 0; i < bindings.length; i++) {
      const binding = bindings[i];
      if (updatedBindings.has(binding)) {
        continue; // すでに更新済みのバインディングはスキップ
      }
      binding.applyChange(this);
    }

    // 静的・動的依存要素のレンダリング
    // インデックス更新があったバインディングに変更を適用する
    const isList = this.isListValue(info);
    const diffResults = isList ? this.#listDiffResultsByRefKey.get(refKey) : null;
    const elementInfo = isList ? getStructuredPathInfo(info.pattern + ".*") : null;
    for(const updateListIndex of diffResults?.updates ?? []) {
      const info = getStructuredPathInfo(updateListIndex.varName);
      const bindings = this.getBindings(info, updateListIndex);
      for(let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];
        if (updatedBindings.has(binding)) {
          continue; // すでに更新済みのバインディングはスキップ
        }
        binding.applyChange(this);
      }
    }

    // 静的依存要素のレンダリング
    for(const subPath of this.#engine?.pathManager.staticDependencies.get(info.pattern) ?? []) {
      const subInfo = getStructuredPathInfo(subPath);
      if (elementInfo?.pattern && subInfo.wildcardPathSet.has(elementInfo.pattern)) {
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
      // リストの依存要素の場合は、静的依存で処理済み
      if (subInfo.wildcardCount > 0) {
        const parentMatchPaths = subInfo.wildcardPathSet.intersection(elementInfo?.wildcardPathSet ?? new Set());
        if (parentMatchPaths.size > 0) {
          if (diffResults?.newListIndexesSet?.size === parentMatchPaths.size) {
            // リストパスが完全に一致する場合
            for(const subListIndex of diffResults?.newListIndexesSet ?? []) {
              listWalker(this.engine, subInfo, subListIndex, (_info, _listIndex) => {
                this.renderItem(_info, _listIndex, trackedRefKeys, updatedBindings, readonlyState);
              });
            }
          } else {
            // リストパスが一部一致する場合
            const lastMatchPath = Array.from(parentMatchPaths).at(-1) as string; // 共通パスを取得
            const lastMatchInfo = getStructuredPathInfo(lastMatchPath); // ワイルドカードのパス情報を取得
            // 共通パスのワイルドカードの深さまでlistIndexを辿る
            const subListIndex = listIndex?.at(lastMatchInfo.wildcardCount - 1) ?? null;
            listWalker(this.engine, subInfo, subListIndex, (_info, _listIndex) => {
              this.renderItem(_info, _listIndex, trackedRefKeys, updatedBindings, readonlyState);
            });
          }
        } else {
          // まったく無関係なリストの場合リストを展開しながらレンダリング
          listWalker(this.engine, subInfo, null, (subInfo, subListIndex) => {
            this.renderItem(subInfo, subListIndex, trackedRefKeys, updatedBindings, readonlyState);
          });
        }

      } else {
        this.renderItem(subInfo, null, trackedRefKeys, updatedBindings, readonlyState);
      }
    }
  }
}

export function render(items: IUpdateInfo[], engine: IComponentEngine): void {
  const renderer = new Renderer(engine);
  renderer.render(items);
}