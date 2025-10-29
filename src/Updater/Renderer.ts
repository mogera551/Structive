import { IComponentEngine } from "../ComponentEngine/types";
import { WILDCARD } from "../constants";
import { IBinding } from "../DataBinding/types";
import { calcListDiff } from "../ListDiff/ListDiff";
import { IListDiff } from "../ListDiff/types";
import { IListIndex } from "../ListIndex/types";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { IPathNode } from "../PathTree/types";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
import { IReadonlyStateHandler, IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { IRenderer, IUpdater } from "./types";

/**
 * Renderer は、State の変更（参照 IStatePropertyRef の集合）に対応して、
 * PathTree を辿りつつ各 Binding（IBinding）へ applyChange を委譲するコーディネータです。
 *
 * 主な役割
 * - reorderList: 要素単位の並べ替え要求を収集し、親リスト単位の差分（IListDiff）へ変換して適用
 * - render: エントリポイント。ReadonlyState を生成し、reorder → 各 ref の描画（renderItem）の順で実行
 * - renderItem: 指定 ref に紐づく Binding を更新し、静的依存（子 PathNode）と動的依存を再帰的に辿る
 * - calcListDiff: リスト参照に対し旧値/新値/旧インデックスから差分を計算し、必要であれば保存
 *
 * コントラクト
 * - Binding#applyChange(renderer): 変更があった場合は renderer.updatedBindings に自分自身を追加すること
 * - engine.saveListAndListIndexes(ref, newValue, newIndexes): リストの論理的状態を最新に保持すること
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

  #updater: IUpdater;

  constructor(engine: IComponentEngine, updater: IUpdater) {
    this.#engine = engine;
    this.#updater = updater;
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

  /**
   * リスト要素の並び替え要求（要素単位）を収集し、対応するリスト（親Ref）に対して
   * 位置変更（changeIndexes）や上書き（overwrites）を含む仮の ListDiff を生成して描画します。
   *
   * ポリシー
   * - 受け取った items は「リスト要素の ref」。親リストの ref を導出して集約する。
   * - 仮の IListDiff を構築し engine.saveListAndListIndexes に保存した後、親リストの PathNode から描画を再入する。
   * - 既に lists に登録されているパターンは親リストとして扱い、要素→親の導出は行わない。
   *
   * Throws:
   * - UPD-003: listIndex の不足
   * - UPD-004: parentInfo 不整合 / 値に対応する旧インデックスが見つからない
   * - UPD-005: oldListValue / oldListIndexes 欠落
   * - PATH-101: 親リストの PathNode 未検出
   */
  reorderList(items: IStatePropertyRef[]): void {
    const listRefs = new Set<IStatePropertyRef>();
    for(let i = 0; i < items.length; i++) {
      const ref = items[i];
      if( this.#engine.pathManager.lists.has(ref.info.pattern) ) {
        listRefs.add(ref);
        continue;
      }
      if (!this.#engine.pathManager.elements.has(ref.info.pattern)) {
        continue; // elements に登録されていないパスはスキップ
      }
      // リスト要素を処理済みに追加
      this.#processedRefs.add(ref);
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
        // リストの差分計算は後続のcalcListDiffで行うので、リオーダーのための計算はスキップ
        continue;
      }
      let indexes = this.#reorderIndexesByRef.get(listRef);
      if (typeof indexes === "undefined") {
        indexes = [];
        this.#reorderIndexesByRef.set(listRef, indexes);
      }
      const listIndex = ref.listIndex ?? raiseError({
        code: "UPD-003",
        message: `ListIndex is null for ref: ${ref.key}`,
        context: { refKey: ref.key, pattern: ref.info.pattern },
        docsUrl: "./docs/error-codes.md#upd",
      });
      indexes.push(listIndex.index);
    }
    for(const [ listRef, indexes ] of this.#reorderIndexesByRef) {
      // listRefのリスト要素をindexesの順に並び替える
      try {
        const newListValue = this.readonlyState[GetByRefSymbol](listRef);
        const { listClone: oldListValue, listIndexes: oldListIndexes } = this.#engine.getListAndListIndexes(listRef);
        if (oldListValue == null || oldListIndexes == null) {
          raiseError({
            code: "UPD-005",
            message: `OldListValue or OldListIndexes is null for ref: ${listRef.key}`,
            context: { refKey: listRef.key, pattern: listRef.info.pattern },
            docsUrl: "./docs/error-codes.md#upd",
          });
        }
        const listDiff: IListDiff = {
          oldListValue: oldListValue,
          newListValue: newListValue,
          oldIndexes: oldListIndexes,
          newIndexes: Array.from(oldListIndexes),
          changeIndexes: new Set(),
          overwrites: new Set(),
          same: true,
        };
        for(let i = 0; i < indexes.length; i++) {
          const index = indexes[i];
          const elementValue = listDiff.newListValue?.[index];
          const oldIndex = listDiff.oldListValue?.indexOf(elementValue) ?? -1;
          if (oldIndex === -1) {
            listDiff.overwrites?.add(listDiff.newIndexes[index]);
          } else {
            const listIndex = listDiff.oldIndexes?.[oldIndex] ?? raiseError({
              code: "UPD-004",
              message: `ListIndex not found for value: ${elementValue}`,
              context: { refKey: listRef.key, pattern: listRef.info.pattern },
              docsUrl: "./docs/error-codes.md#upd",
            });
            listIndex.index = index;
            listDiff.newIndexes[index] = listIndex;
            listDiff.changeIndexes?.add(listIndex);
          }
          listDiff.same = false;
        }
        this.#updater.setListDiff(listRef, listDiff);
        // 並べ替え（および上書き）が発生したので親リストの新状態とインデックスを保存
        const saveInfo = this.#engine.getListAndListIndexes(listRef);
        this.#updater.oldValueAndIndexesByRef.set(listRef, saveInfo);
        this.#engine.saveListAndListIndexes(listRef, newListValue ?? null, listDiff.newIndexes);

        const node = findPathNodeByPath(this.#engine.pathManager.rootNode, listRef.info.pattern);
        if (node === null) {
          raiseError({
            code: "PATH-101",
            message: `PathNode not found: ${listRef.info.pattern}`,
            context: { pattern: listRef.info.pattern },
            docsUrl: "./docs/error-codes.md#path",
          });
        }
        // 親リスト単位で描画を再開する
        this.renderItem(listRef, node);
      } finally {
      }
    }
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

    // 実際のレンダリングロジックを実装
    this.#updater.createReadonlyState( (readonlyState, readonlyHandler) => {
      this.#readonlyState = readonlyState;
      this.#readonlyHandler = readonlyHandler;
      try {
        // まずはリストの並び替えを処理
        this.reorderList(items);

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
      } finally {
        this.#readonlyState = null;
        this.#readonlyHandler = null;
      }
    });
  }

  /**
   * 参照 ref の旧値/新値と保存済みインデックスから ListDiff を計算し、
   * 変更があれば engine.saveListAndListIndexes に保存します。
  *
  * 引数
  * - ref: 対象のリスト参照
  * - _newListValue: isNewValue=true のときのみ使用する、呼び出し側で提供された新リスト値
  * - isNewValue: true の場合、_newListValue を新値とみなす。false の場合は readonlyState から取得
  *
  * メモ
  * - old/new 値の参照比較で異なる場合に限り saveListAndListIndexes を呼び出す
   */
  calcListDiff(ref: IStatePropertyRef): IListDiff | null {
    const tmpValue = this.readonlyState[GetByRefSymbol](ref);
    return this.#updater.getListDiff(ref) ?? null;
  }

  /**
   * 単一の参照 ref と対応する PathNode を描画します。
   *
   * - まず自身のバインディング適用
   * - 次に静的依存（ワイルドカード含む）
   * - 最後に動的依存（ワイルドカードは階層的に展開）
   *
   * 静的依存（子ノード）
   * - 子名が WILDCARD の場合: calcListDiff の adds を利用して各リスト要素に対し再帰描画
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
    if (this.processedRefs.has(ref)) {
      return; // すでに処理済みのRef情報はスキップ
    }
    this.processedRefs.add(ref);

    // バインディングに変更を適用する
    // 変更があったバインディングは updatedBindings に追加する（applyChange 実装の責務）
    const bindings = this.#engine.getBindings(ref);
    for(let i = 0; i < bindings.length; i++) {
      const binding = bindings[i];
      if (this.#updatedBindings.has(binding)) {
        continue; // すでに更新済みのバインディングはスキップ
      }
      binding.applyChange(this);
    }

    // 静的な依存関係を辿る
    for(const [ name, childNode ] of node.childNodeByName) {
      const childInfo = getStructuredPathInfo(childNode.currentPath);
      if (name === WILDCARD) {
        const diff = this.#updater.getListDiff(ref) ?? null;
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
            const tmpValue = this.readonlyState[GetByRefSymbol](depRef);
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

/**
 * 便宜関数。Renderer のインスタンス化と render 呼び出しをまとめて行う。
 */
export function render(refs: IStatePropertyRef[], engine: IComponentEngine, updater: IUpdater): void {
  const renderer = new Renderer(engine, updater);
  renderer.render(refs);
}