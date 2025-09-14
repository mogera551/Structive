import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { IListIndex2 } from "../ListIndex2/types";
import { ILoopContext } from "../LoopContext/types";
import { IReadonlyStateProxy, IStructiveState, IWritableStateProxy } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export type IUpdateInfo = {
  info: IStructuredPathInfo;
  listIndex: IListIndex2 | null;
  value: any;
}

/**
 * 状態管理を更新し、必要に応じてレンダリングを行うインターフェース
 */
export interface IUpdater2 {
  /**
   * 更新したRef情報をキューに追加します。
   * @param info 更新パス
   * @param listIndex 更新リストインデックス
   * @param value 新しい値
   */
  enqueueRef(info: IStructuredPathInfo, listIndex: IListIndex2 | null, value: any): void;
}

/**
 * リストの差分結果
 */
export type IListDiffResults = {
  /**
   * 追加された要素のリストインデックスの配列
   */
  adds?: Set<IListIndex2>,

  /**
   * 更新された要素のリストインデックスの配列
   */
  updates?: Set<IListIndex2>,

  /**
   * 削除された要素のリストインデックスの配列
   */
  removes?: Set<IListIndex2>,

  /**
   * 置き換えられた要素のリストインデックスの配列
   */
  replaces?: Set<IListIndex2>,

  /**
   * 新しい全ての要素のリストインデックスの配列
   */
  newListIndexesSet?: Set<IListIndex2>
}

/**
 * レンダラー
 */
export interface IRenderer {
  /**
   * 更新済みのBindingのセット
   */
  updatedBindings: Set<IBinding>;

  /**
   * 処理済みのRefのキーのセット
   */
  trackedRefKeys : Set<string>;

  /**
   * 読み取り専用状態プロキシ
   */
  readonlyState  : IReadonlyStateProxy;

  /**
   * レンダリング開始
   * @param items 更新情報の配列
   */
  render(items: IUpdateInfo[]): void;

  /**
   * リストの差分結果を取得する
   * @param info パス情報
   * @param listIndex リストインデックス
   */
  getListDiffResults(info: IStructuredPathInfo, listIndex: IListIndex2 | null): IListDiffResults;
}
