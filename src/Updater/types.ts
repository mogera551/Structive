/**
 * types.ts
 *
 * Updater関連の型定義ファイルです。
 *
 * 主な役割:
 * - IUpdater: StateClassの更新処理や変更検知を管理するためのインターフェースを定義
 *   - version: アップデータのバージョン番号
 *   - addProcess: 非同期/同期の更新処理を追加
 *   - addUpdatedStatePropertyRefValue: Stateプロパティ参照の値変更を登録
 *   - addUpdatedListIndex: リストインデックスの変更を登録
 *
 * 設計ポイント:
 * - 状態変更やリストインデックスの更新を一元管理し、再描画や依存解決のトリガーとして利用
 * - 非同期処理や複数の更新処理にも対応できる設計
 */
import { IListIndex2 } from "../ListIndex2/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IUpdater {
  readonly version: number;
  addProcess(process: () => Promise<void> | void): void;
  addUpdatedStatePropertyRefValue(info: IStructuredPathInfo, listIndex: IListIndex2 | null, value:any): void;
  addUpdatedListIndex(listIndex: IListIndex2): void;
}
