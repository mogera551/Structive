/**
 * types.ts
 *
 * StatePropertyRef関連の型定義ファイルです。
 *
 * 主な役割:
 * - IStatePropertyRef: 構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を組み合わせた
 *   Stateプロパティ参照の型を定義
 *
 * 設計ポイント:
 * - パス情報とリストインデックスをセットで管理し、状態管理や依存解決、キャッシュなどに利用
 * - listIndexはnull許容で、非リスト参照にも対応
 */
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IStatePropertyRef {
  info: IStructuredPathInfo;
  readonly listIndex: IListIndex | null;
  key: string;
  readonly parentRef: IStatePropertyRef | null;
}