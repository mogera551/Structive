import { IListIndex } from "../ListIndex/types";
import { IState } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePathInfoManager } from "./StatePathInfoManager/types";

export interface IStateManager {
  state: IState; // 素の状態オブジェクト
  pathManager: IStatePathInfoManager; // パス情報の管理


}

// キャッシュとリスト
export interface IStateEntry {
  path: string | null;
  info: IStructuredPathInfo | null; // リストインデックスだけの場合はnull
  listIndex: IListIndex | null; // リストインデックスがある場合はnull以外
  value: any; // エントリの値
  version: number; // バージョン管理のための番号
  get disposable(): boolean; // このエントリが破棄可能かどうか
}
