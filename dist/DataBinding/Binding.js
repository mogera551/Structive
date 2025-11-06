/**
 * Bindingクラスは、1つのバインディング（ノードと状態の対応）を管理する中核的な実装です。
 *
 * 主な役割:
 * - DOMノードと状態（State）を結びつけるバインディングノード（bindingNode）とバインディング状態（bindingState）の生成・管理
 * - バインディングの初期化（init）、再描画（render）、状態値の更新（updateStateValue）などの処理を提供
 * - バージョン管理により、不要な再描画を防止
 *
 * 設計ポイント:
 * - createBindingNode, createBindingStateファクトリで柔軟なバインディング構造に対応
 * - renderでバージョン差分がある場合のみバインディングノードを更新
 * - 双方向バインディング時はupdateStateValueで状態プロキシに値を反映
 * - createBinding関数で一貫したバインディング生成を提供
 */
class Binding {
    parentBindContent;
    node;
    engine;
    bindingNode;
    bindingState;
    version;
    bindingsByListIndex = new WeakMap();
    constructor(parentBindContent, node, engine, createBindingNode, createBindingState) {
        this.parentBindContent = parentBindContent;
        this.node = node;
        this.engine = engine;
        this.bindingNode = createBindingNode(this, node, engine.inputFilters);
        this.bindingState = createBindingState(this, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    updateStateValue(writeState, handler, value) {
        return this.bindingState.assignValue(writeState, handler, value);
    }
    notifyRedraw(refs) {
        this.bindingNode.notifyRedraw(refs);
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this))
            return;
        renderer.updatedBindings.add(this);
        this.bindingNode.applyChange(renderer);
        const ref = this.bindingState.ref;
        if (!this.bindingState.isLoopIndex && !this.engine.pathManager.dynamicDependencies.has(ref.info.pattern)) {
            const bindings = this.engine.getBindings(ref);
            if (bindings.length === 1) {
                renderer.processedRefs.add(ref);
            }
        }
    }
}
/**
 * バインディング生成用ファクトリ関数
 * - 各種ファクトリ・エンジン・ノード情報からBindingインスタンスを生成
 */
export function createBinding(parentBindContent, node, engine, createBindingNode, createBindingState) {
    return new Binding(parentBindContent, node, engine, createBindingNode, createBindingState);
}
