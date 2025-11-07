import { IComponentEngine } from "../ComponentEngine/types";
import { WILDCARD } from "../constants";
import { IBinding } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { IPathNode } from "../PathTree/types";
import { createReadonlyStateHandler, createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetListIndexesByRefSymbol } from "../StateClass/symbols";
import { IReadonlyStateHandler, IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { IListInfo, IRenderer, IUpdater, ReadonlyStateCallback } from "./types";

/**
 * Renderer は、State の変更（参照 IStatePropertyRef の集合）に対応して、
 * PathTree を辿りつつ各 Binding（IBinding）へ applyChange を委譲するコーディネータです。
 *
 * 主な役割
 * - reorderList: 要素単位の並べ替え要求を収集し、親リスト単位の差分（IListDiff）へ変換して適用
 * - render: エントリポイント。ReadonlyState を生成し、reorder → 各 ref の描画（renderItem）の順で実行
 * - renderItem: 指定 ref に紐づく Binding を更新し、静的依存（子 PathNode）と動的依存を再帰的に辿る
 *
 * コントラクト
 * - Binding#applyChange(renderer): 変更があった場合は renderer.updatedBindings に自分自身を追加すること
 * - readonlyState[GetByRefSymbol](ref): ref の新しい値（読み取り専用ビュー）を返すこと
 *
 * スレッド/再入
 * - 同期実行前提。
 *
 * 代表的な例外
 * - UPD-001/002: Engine/ReadonlyState の未初期化
 * - UPD-003/004/005/006: ListIndex/ParentInfo/OldList* の不整合や ListDiff 未生成
 * - PATH-101: PathNode が見つからない
 */
class Renderer implements IRenderer {
  #updatingRefs: IStatePropertyRef[] = [];
  #updatingRefSet: Set<IStatePropertyRef> = new Set();
  /**
   * このレンダリングサイクルで「変更あり」となった Binding の集合。
   * 注意: 実際に追加するのは各 binding.applyChange 実装側の責務。
   */
  #updatedBindings: Set<IBinding> = new Set();
  /**
   * 二重適用を避けるために処理済みとした参照。
   * renderItem の再帰や依存関係の横断時に循環/重複を防ぐ。
   */
  #processedRefs: Set<IStatePropertyRef> = new Set();
  /**
   * レンダリング対象のエンジン。state, pathManager, bindings などのファサード。
   */
  #engine: IComponentEngine;
  #readonlyState: IReadonlyStateProxy | null = null;

  #readonlyHandler : IReadonlyStateHandler | null = null;

  /**
   * 親リスト参照ごとに「要素の新しい並び位置」を記録するためのインデックス配列。
   * reorderList で収集し、後段で仮の IListDiff を生成するために用いる。
   */
  #reorderIndexesByRef: Map<IStatePropertyRef, number[]> = new Map();

  #lastListInfoByRef: Map<IStatePropertyRef, IListInfo> = new Map();

  #updater: IUpdater;

  constructor(engine: IComponentEngine, updater: IUpdater) {
    this.#engine = engine;
    this.#updater = updater;
  }

  get updatingRefs(): IStatePropertyRef[] {
    return this.#updatingRefs;
  }

  get updatingRefSet(): Set<IStatePropertyRef> {
    return this.#updatingRefSet;
  }

  /**
   * このサイクル中に更新された Binding の集合を返す（読み取り専用的に使用）。
   */
  get updatedBindings(): Set<IBinding> {
    return this.#updatedBindings;
  }

  /**
   * 既に処理済みの参照集合を返す。二重適用の防止に利用する。
   */
  get processedRefs(): Set<IStatePropertyRef> {
    return this.#processedRefs;
  }

  /**
   * 読み取り専用 State ビューを取得する。render 実行中でなければ例外。
   * Throws: UPD-002
   */
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

  get readonlyHandler(): IReadonlyStateHandler {
    if (!this.#readonlyHandler) {
      raiseError({
        code: "UPD-002",
        message: "ReadonlyHandler not initialized",
        docsUrl: "./docs/error-codes.md#upd",
      });
    }
    return this.#readonlyHandler;
  }

  /**
   * バッキングエンジンを取得する。未初期化の場合は例外。
   * Throws: UPD-001
   */
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

  get lastListInfoByRef(): Map<IStatePropertyRef, IListInfo> {
    return this.#lastListInfoByRef;
  }

  /**
   * リードオンリーな状態を生成し、コールバックに渡す
   * @param callback 
   * @returns 
   */
  createReadonlyState(callback: ReadonlyStateCallback): any {
    const handler = createReadonlyStateHandler(this.#engine, this.#updater, this);
    const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
    return callback(stateProxy, handler);
  }

  /**
   * レンダリングのエントリポイント。ReadonlyState を生成し、
   * 並べ替え処理→各参照の描画の順に処理します。
   *
   * 注意
   * - readonlyState はこのメソッドのスコープ内でのみ有効。
   * - SetCacheableSymbol により参照解決のキャッシュをまとめて有効化できる。
   */
  render(items: IStatePropertyRef[]): void {
    this.#reorderIndexesByRef.clear();
    this.#processedRefs.clear();
    this.#updatedBindings.clear();
    this.#updatingRefs = [...items];
    this.#updatingRefSet = new Set(items);

    // 実際のレンダリングロジックを実装
    this.createReadonlyState( (readonlyState, readonlyHandler) => {
      this.#readonlyState = readonlyState;
      this.#readonlyHandler = readonlyHandler;
      try {
        // まずはリストの並び替えを処理
        const remainItems: IStatePropertyRef[] = [];
        const itemsByListRef = new Map<IStatePropertyRef, Set<IStatePropertyRef>>();
        const refSet = new Set<IStatePropertyRef>();
        for(let i = 0; i < items.length; i++) {
          const ref = items[i];
          refSet.add(ref);
          if (!this.#engine.pathManager.elements.has(ref.info.pattern)) {
            remainItems.push(ref);
            continue;
          }
          const listRef = ref.parentRef ?? raiseError({
            code: "UPD-004",
            message: `ParentInfo is null for ref: ${ref.key}`,
            context: { refKey: ref.key, pattern: ref.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
          if (!itemsByListRef.has(listRef)) {
            itemsByListRef.set(listRef, new Set());
          }
          itemsByListRef.get(listRef)!.add(ref);
        }
        for(const [listRef, refs] of itemsByListRef) {
          if (refSet.has(listRef)) {
            for(const ref of refs) {
              this.#processedRefs.add(ref); // 終了済み
            }
            continue; // 親リストが存在する場合はスキップ
          }
          const bindings = this.#engine.getBindings(listRef);
          for(let i = 0; i < bindings.length; i++) {
            if (this.#updatedBindings.has(bindings[i])) continue;
            bindings[i].applyChange(this);
          }
          this.processedRefs.add(listRef);
        }

        for(let i = 0; i < remainItems.length; i++) {
          const ref = remainItems[i];
          const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
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
        // 子コンポーネントへの再描画通知
        if (this.#engine.structiveChildComponents.size > 0) {
          for(const structiveComponent of this.#engine.structiveChildComponents) {
            const structiveComponentBindings = this.#engine.bindingsByComponent.get(structiveComponent) ?? new Set<IBinding>();
            for(const binding of structiveComponentBindings) {
              binding.notifyRedraw(remainItems);
            }
          }
        }

      } finally {
        this.#readonlyState = null;
        this.#readonlyHandler = null;
      }
    });
  }

  /**
   * 単一の参照 ref と対応する PathNode を描画します。
   *
   * - まず自身のバインディング適用
   * - 次に静的依存（ワイルドカード含む）
   * - 最後に動的依存（ワイルドカードは階層的に展開）
   *
   * 静的依存（子ノード）
   * - それ以外: 親の listIndex を引き継いで子参照を生成して再帰描画
   *
   * 動的依存
   * - pathManager.dynamicDependencies に登録されたパスを基に、ワイルドカードを展開しつつ描画を再帰
   *
   * Throws
   * - UPD-006: WILDCARD 分岐で ListDiff が未計算（null）の場合
   * - PATH-101: 動的依存の PathNode 未検出
   */
  renderItem(
    ref: IStatePropertyRef,
    node: IPathNode,
  ): void {
    this.processedRefs.add(ref);

    // バインディングに変更を適用する
    // 変更があったバインディングは updatedBindings に追加する（applyChange 実装の責務）
    const bindings = this.#engine.getBindings(ref);
    for(let i = 0; i < bindings.length; i++) {
      if (this.#updatedBindings.has(bindings[i])) continue;
      bindings[i].applyChange(this);
    }

    let diffListIndexes: Set<IListIndex> = new Set();
    if (this.#engine.pathManager.lists.has(ref.info.pattern)) {
      const currentListIndexes = new Set(this.readonlyState[GetListIndexesByRefSymbol](ref) ?? []);
      const { listIndexes } = this.lastListInfoByRef.get(ref) ?? {};
      const lastListIndexSet = new Set(listIndexes ?? []);
      diffListIndexes = currentListIndexes.difference(lastListIndexSet);
    }

    // 静的な依存関係を辿る
    for(const [ name, childNode ] of node.childNodeByName) {
      const childInfo = getStructuredPathInfo(childNode.currentPath);
      if (name === WILDCARD) {
        for(const listIndex of diffListIndexes) {
          const childRef = getStatePropertyRef(childInfo, listIndex);
          if (!this.processedRefs.has(childRef)) {
            this.renderItem(childRef, childNode);
          }
        }
      } else {
        const childRef = getStatePropertyRef(childInfo, ref.listIndex);
        if (!this.processedRefs.has(childRef)) {
          this.renderItem(childRef, childNode);
        }
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
            const listIndexes = this.readonlyState[GetListIndexesByRefSymbol](depRef) || [];
            if ((index + 1) < infos.length) {
              for(let i = 0; i < listIndexes.length; i++) {
                const nextRef = getStatePropertyRef(nextInfo, listIndexes[i]);
                walk(nextRef, index + 1, infos[index + 1]);
              }
            } else {
              for(let i = 0; i < listIndexes.length; i++) {
                const subDepRef = getStatePropertyRef(depInfo, listIndexes[i]);
                if (!this.processedRefs.has(subDepRef)) {
                  this.renderItem(subDepRef, depNode);
                }
              }
            }
          }
          const startRef = getStatePropertyRef(depInfo.wildcardParentInfos[0], null);
          walk(startRef, 0, depInfo.wildcardParentInfos[1] || null);
        } else {
          const depRef = getStatePropertyRef(depInfo, null);
          if (!this.processedRefs.has(depRef)) {
            this.renderItem(depRef, depNode);
          }
        }
      }
    }
  }

  
}

/**
 * 便宜関数。Renderer のインスタンス化と render 呼び出しをまとめて行う。
 */
export function render(refs: IStatePropertyRef[], engine: IComponentEngine, updater: IUpdater): void {
  const renderer = new Renderer(engine, updater);
  renderer.render(refs);
}