import { ISaveInfoByResolvedPathInfo } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { IListDiff } from "../ListDiff/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IReadonlyStateHandler, IReadonlyStateProxy, IStructiveState, IWritableStateHandler, IWritableStateProxy } from "../StateClass/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export type UpdateCallback = (state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<any> | any;
export type ReadonlyStateCallback = (state: IReadonlyStateProxy, handler: IReadonlyStateHandler) => Promise<any> | any;

/**
 * 状態管理を更新し、必要に応じてレンダリングを行うインターフェース
 */
export interface IUpdater {
  readonly version: number;
  readonly revision: number;
  readonly revisionByUpdatedPath: Map<string, number>;
  readonly oldValueAndIndexesByRef: Map<IStatePropertyRef, ISaveInfoByResolvedPathInfo>;
  
  /**
   * 更新したRef情報をキューに追加します。
   * @param ref 更新するStateプロパティの参照情報 (IStatePropertyRef)
   * @param value 新しい値
   */
  enqueueRef(ref: IStatePropertyRef): void;
  /**
   * 更新処理を実行します。
   * @param loopContext ループコンテキスト
   * @param callback Updaterを返すコールバック関数
   */
  update(loopContext: ILoopContext | null, callback: UpdateCallback): Promise<void> | void;
  /**
   * 
   */
  createReadonlyState(callback: ReadonlyStateCallback): any;

  calcListDiff(ref: IStatePropertyRef, newListValue?: any): boolean;
  getListDiff(ref: IStatePropertyRef): IListDiff | undefined;
  setListDiff(ref: IStatePropertyRef, diff: IListDiff): void;
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
  processedRefs: Set<IStatePropertyRef>;

  /**
   * 読み取り専用状態プロキシ
   */
  readonlyState: IReadonlyStateProxy;
  readonlyHandler: IReadonlyStateHandler;

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
  calcListDiff(ref: IStatePropertyRef, newListValue?: any[] | undefined | null, isNewValue?: boolean): IListDiff | null;
}
