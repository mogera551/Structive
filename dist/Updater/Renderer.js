import { WILDCARD } from "../constants";
import { calcListDiff } from "../ListDiff/ListDiff";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../utils";
/**
 * Renderer は、State の変更に応じて各 Binding に applyChange を委譲し、
 * PathTree を辿りながら必要な箇所のみをレンダリングする責務を負います。
 *
 * - reorderList: 単一要素の並べ替え要求を取りまとめ、対応するリストの差分に変換
 * - render: ルート呼び出し。readonlyState を生成し、renderItem を走査
 * - renderItem: 静的/動的依存を処理しつつ、該当パスのバインディングに更新を適用
 * - calcListDiff: 参照 ref に対して ListDiff を計算し、必要に応じてエンジンに保存
 *
 * Throws（代表例）:
 * - UPD-001/002: Engine/ReadonlyState の未初期化
 * - UPD-003/004/005/006: ListIndex/ParentInfo/OldList* の不整合や ListDiff 未生成
 * - PATH-101: PathNode が見つからない
 */
class Renderer {
    #updatedBindings = new Set();
    #processedRefs = new Set();
    #engine;
    #readonlyState = null;
    #listDiffByRef = new Map();
    #reorderIndexesByRef = new Map();
    constructor(engine) {
        this.#engine = engine;
    }
    get updatedBindings() {
        return this.#updatedBindings;
    }
    get processedRefs() {
        return this.#processedRefs;
    }
    get readonlyState() {
        if (!this.#readonlyState) {
            raiseError({
                code: "UPD-002",
                message: "ReadonlyState not initialized",
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        return this.#readonlyState;
    }
    get engine() {
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
     */
    reorderList(items) {
        const listRefs = new Set();
        for (let i = 0; i < items.length; i++) {
            const ref = items[i];
            if (this.engine.pathManager.lists.has(ref.info.pattern)) {
                listRefs.add(ref);
                continue;
            }
            if (!this.engine.pathManager.elements.has(ref.info.pattern)) {
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
        for (const [listRef, indexes] of this.#reorderIndexesByRef) {
            this.#listDiffByRef.set(listRef, null); // calcListDiff中に再帰的に呼ばれた場合に備えてnullをセットしておく
            // listRefのリスト要素をindexesの順に並び替える
            try {
                const newListValue = this.readonlyState[GetByRefSymbol](listRef);
                const [, oldListIndexes, oldListValue] = this.engine.getListAndListIndexes(listRef);
                if (oldListValue == null || oldListIndexes == null) {
                    raiseError({
                        code: "UPD-005",
                        message: `OldListValue or OldListIndexes is null for ref: ${listRef.key}`,
                        context: { refKey: listRef.key, pattern: listRef.info.pattern },
                        docsUrl: "./docs/error-codes.md#upd",
                    });
                }
                const listDiff = {
                    oldListValue: oldListValue,
                    newListValue: newListValue,
                    oldIndexes: oldListIndexes,
                    newIndexes: Array.from(oldListIndexes),
                    changeIndexes: new Set(),
                    overwrites: new Set(),
                };
                for (let i = 0; i < indexes.length; i++) {
                    const index = indexes[i];
                    const elementValue = listDiff.newListValue?.[index];
                    const oldIndex = listDiff.oldListValue?.indexOf(elementValue) ?? -1;
                    if (oldIndex === -1) {
                        listDiff.overwrites?.add(listDiff.newIndexes[index]);
                    }
                    else {
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
                }
                this.#listDiffByRef.set(listRef, listDiff);
                const node = findPathNodeByPath(this.#engine.pathManager.rootNode, listRef.info.pattern);
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
            finally {
            }
        }
    }
    /**
     * レンダリングのエントリポイント。ReadonlyState を生成し、
     * 並べ替え処理→各参照の描画の順に処理します。
     */
    render(items) {
        this.#listDiffByRef.clear();
        this.#reorderIndexesByRef.clear();
        this.#processedRefs.clear();
        this.#updatedBindings.clear();
        // 実際のレンダリングロジックを実装
        const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state, this);
        try {
            readonlyState[SetCacheableSymbol](() => {
                // まずはリストの並び替えを処理
                this.reorderList(items);
                for (let i = 0; i < items.length; i++) {
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
        }
        finally {
            this.#readonlyState = null;
        }
    }
    /**
     * 参照 ref の旧値/新値と保存済みインデックスから ListDiff を計算し、
     * 変更があれば engine.saveListAndListIndexes に保存します。
     */
    calcListDiff(ref, _newListValue = undefined, isNewValue = false) {
        let listDiff = this.#listDiffByRef.get(ref);
        if (typeof listDiff === "undefined") {
            this.#listDiffByRef.set(ref, null); // calcListDiff中に再帰的に呼ばれた場合に備えてnullをセットしておく
            const [oldListValue, oldListIndexes] = this.engine.getListAndListIndexes(ref);
            let newListValue = isNewValue ? _newListValue : this.readonlyState[GetByRefSymbol](ref);
            listDiff = calcListDiff(ref.listIndex, oldListValue, newListValue, oldListIndexes);
            this.#listDiffByRef.set(ref, listDiff);
            if (oldListValue !== newListValue) {
                this.engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
            }
        }
        return listDiff;
    }
    /**
     * 単一の参照 ref と対応する PathNode を描画します。
     *
     * - まず自身のバインディング適用
     * - 次に静的依存（ワイルドカード含む）
     * - 最後に動的依存（ワイルドカードは階層的に展開）
     */
    renderItem(ref, node) {
        if (this.processedRefs.has(ref)) {
            return; // すでに処理済みのRef情報はスキップ
        }
        this.processedRefs.add(ref);
        // バインディングに変更を適用する
        // 変更があったバインディングはupdatedBindingsに追加する
        const bindings = this.#engine.getBindings(ref);
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            if (this.updatedBindings.has(binding)) {
                continue; // すでに更新済みのバインディングはスキップ
            }
            binding.applyChange(this);
        }
        // 静的な依存関係を辿る
        for (const [name, childNode] of node.childNodeByName) {
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
                for (const listIndex of diff.adds ?? []) {
                    const childRef = getStatePropertyRef(childInfo, listIndex);
                    this.renderItem(childRef, childNode);
                }
            }
            else {
                const childRef = getStatePropertyRef(childInfo, ref.listIndex);
                this.renderItem(childRef, childNode);
            }
        }
        // 動的な依存関係を辿る
        const deps = this.#engine.pathManager.dynamicDependencies.get(ref.info.pattern);
        if (deps) {
            for (const depPath of deps) {
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
                    const walk = (depRef, index, nextInfo) => {
                        const listIndexes = this.#engine.getListIndexes(depRef) || [];
                        if ((index + 1) < infos.length) {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const nextRef = getStatePropertyRef(nextInfo, listIndexes[i]);
                                walk(nextRef, index + 1, infos[index + 1]);
                            }
                        }
                        else {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const subDepRef = getStatePropertyRef(depInfo, listIndexes[i]);
                                this.renderItem(subDepRef, depNode);
                            }
                        }
                    };
                    const startRef = getStatePropertyRef(depInfo.wildcardParentInfos[0], null);
                    walk(startRef, 0, depInfo.wildcardParentInfos[1] || null);
                }
                else {
                    const depRef = getStatePropertyRef(depInfo, null);
                    this.renderItem(depRef, depNode);
                }
            }
        }
    }
}
export function render(refs, engine) {
    const renderer = new Renderer(engine);
    renderer.render(refs);
}
