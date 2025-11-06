import { IBinding } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IReadonlyStateHandler, IReadonlyStateProxy, IStructiveState, IWritableStateHandler, IWritableStateProxy } from "../StateClass/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export type UpdateCallback = (state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<any> | any;
export type ReadonlyStateCallback<T = any> = (state: IReadonlyStateProxy, handler: IReadonlyStateHandler) => Promise<T> | T;

/**
 * 状態管理を更新し、必要に応じてレンダリングを行うインターフェース
 */
export interface IUpdater {
  readonly version: number;
  readonly revision: number;
  
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

  swapInfoByRef: Map<IStatePropertyRef, IListInfo>;

  createReadonlyState<T = any>(callback: ReadonlyStateCallback<T>): T;
}

export interface IListInfo {
  value: any[];
  listIndexes: IListIndex[];
}

/**
 * レンダラー
 */
export interface IRenderer {
  /**
   * 更新中のRefのセット
   */
  updatingRefs: IStatePropertyRef[];
  updatingRefSet: Set<IStatePropertyRef>;
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

  lastListInfoByRef: Map<IStatePropertyRef, IListInfo>;

  /**
   * 
   */
  createReadonlyState<T = any>(callback: ReadonlyStateCallback<T>): T;
}
