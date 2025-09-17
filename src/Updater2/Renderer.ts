import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { IListIndex2 } from "../ListIndex2/types";
import { listWalker } from "../ListWalker/listWalker";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
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
    const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state);
    try {
      readonlyState[SetCacheableSymbol](() => {
        // リストの差分計算実行
        const updatingItems = new Map<string, IUpdateInfo>();
        for(const item of items) {
          const refKey = createRefKey(item.info, item.listIndex);
          if (this.engine.pathManager.lists.has(item.info.pattern)) {
            this.updateListIndexes(item.info, item.listIndex);
            updatingItems.set(refKey, item);
          } else if (this.engine.pathManager.elements.has(item.info.pattern)) {
            if (!item.listIndex) {
              raiseError(`Renderer.render: listIndex is null for element ${item.info.pattern}`);
            }
            const listInfo = item.info.parentInfo;
            if (!listInfo) {
              raiseError(`Renderer.render: parentInfo is not found for element ${item.info.pattern}`);
            }
            const listListIndex = listInfo.wildcardCount < item.info.wildcardCount ? item.listIndex?.at(-2) ?? null : item.listIndex;

            this.updateElements(item.info, item.listIndex, item.value, listInfo, listListIndex);
            const refKey = createRefKey(listInfo, listListIndex);
            updatingItems.set(refKey, {info: listInfo, listIndex: listListIndex, value: null });
          } else {
            updatingItems.set(refKey, item);
          }
        }
        // 各Ref情報に対してレンダリングを実行
        // trackedRefKeysに追加されているRef情報はスキップ
        // updatedBindingsに追加されているバインディングはスキップ
        for(const [refKey, item] of updatingItems.entries()) {
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

  getListDiffResults(info: IStructuredPathInfo, listIndex: IListIndex2 | null): IListDiffResults {
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
    // エンジンから古いリストインデックスセットを取得
    return this.engine.getListIndexesSet(info, listIndex) ?? null;
  }

  setOldListIndexesSet(info: IStructuredPathInfo, listIndex: IListIndex2 | null, listIndexesSet: Set<IListIndex2>): void {
    // エンジンに古いリストインデックスセットを保存
    this.engine.saveListIndexesSet(info, listIndex, listIndexesSet);
  }

  getOldValue(info: IStructuredPathInfo, listIndex: IListIndex2 | null): any[] | null {
    // エンジンから古い値を取得
    return this.engine.getList(info, listIndex) ?? null;
  }

  setOldValue(info: IStructuredPathInfo, listIndex: IListIndex2 | null, value: any[]): void {
    // エンジンに古い値を保存
    this.engine.saveList(info, listIndex, Array.from(value));
  }

  getBindings(info: IStructuredPathInfo, listIndex: IListIndex2 | null): IBinding[] {
    // エンジンからバインディングを取得
    return this.engine.getBindings(info, listIndex) ?? [];
  }

  updateListIndexes(
    info: IStructuredPathInfo, 
    listIndex: IListIndex2 | null, 
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
  updateElements(
    info: IStructuredPathInfo, 
    listIndex: IListIndex2,
    value: any[] | undefined | null,
    listInfo: IStructuredPathInfo,
    listListIndex: IListIndex2 | null = null,
  ) {
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

    // 静的・動的依存要素のレンダリング
    const isList = this.isListValue(info);
    const diffResults = isList ? this.#listDiffResultsByRefKey.get(refKey) : null;
    const elementInfo = isList ? getStructuredPathInfo(info.pattern + ".*") : null;
    // インデックス更新があったバインディングに変更を適用する
    for(const updateListIndex of diffResults?.updates ?? []) {
      const info = getStructuredPathInfo(updateListIndex.varName);
      const bindings = this.getBindings(info, updateListIndex);
      for(const binding of bindings) {
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