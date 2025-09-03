/**
 * DependencyWalker/types.ts
 *
 * 依存関係グラフ探索に関する型定義ファイルです。
 *
 * - IDependencyWalker: 依存関係グラフを探索するためのインターフェース
 *   - walk: 依存ノードごとにコールバックを実行するメソッド
 *
 * - DependencyType: 依存関係の種別（"structured" | "reference"）
 *
 * - IDependencyEdge: 依存関係グラフのエッジ情報（パス情報と依存種別の組み合わせ）
 */
import { IListIndex2 } from "../ListIndex2/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IDependencyWalker {
  walk(
    callback: (ref: { info: IStructuredPathInfo, listIndex: IListIndex2 | null }, info: IStructuredPathInfo) => void
  ): void;
}

export type DependencyType = "structured" | "reference";

export interface IDependencyEdge {
  info: IStructuredPathInfo;
  type: DependencyType;
}
