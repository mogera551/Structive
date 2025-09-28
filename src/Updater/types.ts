import { IBinding } from "../DataBinding/types";
import { IListDiff } from "../ListDiff/types";
import { IReadonlyStateProxy, IStructiveState, IWritableStateProxy } from "../StateClass/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

/**
 * 状態管理を更新し、必要に応じてレンダリングを行うインターフェース
 */
export interface IUpdater {
  /**
   * 更新したRef情報をキューに追加します。
   * @param ref 更新するStateプロパティの参照情報 (IStatePropertyRef)
   * @param value 新しい値
   */
  enqueueRef(ref: IStatePropertyRef): void;
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
  trackedRefs: Set<IStatePropertyRef>;

  /**
   * 読み取り専用状態プロキシ
   */
  readonlyState: IReadonlyStateProxy;

  /**
   * レンダリング開始
   * @param items 更新情報の配列
   */
  render(items: IStatePropertyRef[]): void;

  /**
   * リストの差分結果を取得する
   * @param ref 参照情報
   * @param newListValue 新しいリストの値
   * @param isNewValue 新しい値をセットしたかどうか
   */
  calcListDiff(ref: IStatePropertyRef, newListValue?: any[] | undefined | null, isNewValue?: boolean): IListDiff;
}
