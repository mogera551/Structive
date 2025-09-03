/**
 * createDependencyWalker.ts
 *
 * 依存関係グラフを辿るためのDependencyWalkerクラスと、その生成ファクトリです。
 *
 * 主な役割:
 * - 依存関係グラフ（dependentTree）を深さ優先で再帰的に探索し、各依存ノードに対してコールバックを実行
 * - ループ検出のためにtracedセットで訪問済みノードを管理し、無限ループを防止
 * - 依存種別（DependencyType）に応じて探索方法を柔軟に切り替え
 *
 * 設計ポイント:
 * - walkSubで再帰的に依存ノードを探索し、structured依存の場合は親のtypeを引き継ぐ
 * - tracedセットで一度訪れたノードは再訪しない
 * - walkでエントリポイントから探索を開始し、コールバックを全ノードに適用
 * - createDependencyWalkerファクトリで一貫した生成・利用が可能
 */
import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex2 } from "../ListIndex2/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { createDependencyKey } from "./createDependencyEdge";
import { DependencyType } from "./types";

class dependencyWalker {
  engine: IComponentEngine;
  entryRef: { info: IStructuredPathInfo, listIndex: IListIndex2 | null };
  traced: Set<string> = new Set<string>();
  constructor(
    engine: IComponentEngine,
    entryRef: { info: IStructuredPathInfo, listIndex: IListIndex2 | null },
  ) {
    this.engine = engine;
    this.entryRef = entryRef;
  }

  walkSub(
    info: IStructuredPathInfo,
    type: DependencyType,
    callback: (ref: IStatePropertyRef, info: IStructuredPathInfo, type: DependencyType) => void
  ) {
    const key = createDependencyKey(info, type);
    if (this.traced.has(key)) {
      return;
    }
    this.traced.add(key);
    callback(this.entryRef, info, type);
    const edges = this.engine.dependentTree.get(info) ?? [];
    for(const edge of edges) {
      const overridedType = edge.type === "structured" ? type : edge.type;
      this.walkSub(edge.info, overridedType, callback);
    }

  }
  walk(
    callback: (ref: IStatePropertyRef, info: IStructuredPathInfo, type: DependencyType) => void
  ) {
    const traced = new Set<IStructuredPathInfo>();
    this.walkSub(this.entryRef.info, "structured", callback);
  } 

}

export function createDependencyWalker(
  engine: IComponentEngine,
  entryRef: { info: IStructuredPathInfo, listIndex: IListIndex2 | null },
) {
  return new dependencyWalker(engine, entryRef);
}