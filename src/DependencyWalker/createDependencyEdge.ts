/**
 * createDependencyEdge.ts
 *
 * 依存関係グラフのエッジ（IDependencyEdge）を生成・キャッシュするユーティリティです。
 *
 * 主な役割:
 * - IStructuredPathInfo（プロパティパス情報）とDependencyType（依存種別）から一意なキーを生成
 * - 同じ依存エッジはキャッシュし、重複生成を防止
 * - createDependencyEdgeでIDependencyEdgeインスタンスを取得（キャッシュ利用）
 *
 * 設計ポイント:
 * - createDependencyKeyで「パターン@種別」の一意キーを生成
 * - cacheオブジェクトでIDependencyEdgeを再利用し、メモリ効率と比較効率を向上
 */
import { IStructuredPathInfo } from "../StateProperty/types";
import { DependencyType, IDependencyEdge } from "./types";

/**
 * infoとtypeから依存関係エッジの一意キーを生成
 */
export function createDependencyKey(info: IStructuredPathInfo, type: DependencyType): string {
  return `${info.pattern}@${type}`;
}

const cache: {[key:string]:IDependencyEdge} = {};;

/**
 * 依存関係エッジ（IDependencyEdge）を生成・キャッシュして返す
 */
export function createDependencyEdge(
  info: IStructuredPathInfo,
  type: DependencyType,
): IDependencyEdge {
  const key = createDependencyKey(info, type);
  return cache[key] ?? (cache[key] = { info, type });
}
