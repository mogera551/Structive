import { IComponentEngine } from "../ComponentEngine/types";
import { IReadonlyStateProxy, IWritableStateProxy } from "../StateClass/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { CreateBindingNodeByNodeFn, IBindingNode } from "./BindingNode/types";
import { CreateBindingStateByStateFn, IBindingState } from "./BindingState/types";
import { IBindContent, IBinding } from "./types";

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
class Binding implements IBinding {
  parentBindContent: IBindContent;
  node             : Node;
  engine           : IComponentEngine;
  bindingNode      : IBindingNode;
  bindingState     : IBindingState;
  version          : number | undefined;
  constructor(
    parentBindContent : IBindContent,
    node              : Node,
    engine            : IComponentEngine,
    createBindingNode : CreateBindingNodeByNodeFn, 
    createBindingState: CreateBindingStateByStateFn,
  ) {
    this.parentBindContent = parentBindContent
    this.node = node;
    this.engine = engine
    this.bindingNode = createBindingNode(this, node, engine.inputFilters);
    this.bindingState = createBindingState(this, engine.readonlyState, engine.outputFilters);
  }

  get bindContents() {
    return this.bindingNode.bindContents;
  }

  init() {
    this.bindingNode.init();
    this.bindingState.init();
  }

  render() {
    if (this.version !== this.engine.updater.version) {
      try {
        this.bindingNode.update();
      } finally {
        this.version = this.engine.updater.version;
      }
    }
  }

  updateStateValue(writeState:IWritableStateProxy, value: any) {
    return this.bindingState.assignValue(writeState, value);
  }

  notifyRedraw(refs: IStatePropertyRef[]) {
    this.bindingNode.notifyRedraw(refs);
  }

  applyChange(state: IReadonlyStateProxy, updatedBinds: Set<IBinding>): void {
    if (!updatedBinds.has(this)) return;
    this.bindingNode.applyChange(state, updatedBinds);
  }
}

/**
 * バインディング生成用ファクトリ関数
 * - 各種ファクトリ・エンジン・ノード情報からBindingインスタンスを生成
 */
export function createBinding(
  parentBindContent : IBindContent,
  node              : Node, 
  engine            : IComponentEngine, 
  createBindingNode : CreateBindingNodeByNodeFn, 
  createBindingState: CreateBindingStateByStateFn
): IBinding {
  return new Binding(
    parentBindContent, 
    node, 
    engine, 
    createBindingNode, 
    createBindingState
  );
}