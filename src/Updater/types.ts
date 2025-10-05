import { IBinding } from "../DataBinding/types";
import { IListDiff } from "../ListDiff/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IReadonlyStateProxy, IState, IStateProxy, IStructiveState, IWritableStateProxy } from "../StateClass/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

/**
 * 状態管理を更新し、必要に応じてレンダリングを行うインターフェース
 */
export interface IUpdater {
  /**
   * Updaterのバージョン
   */
  readonly version: number;
  /**
   * リスト参照の差分計算キャッシュ。
   */
  readonly listDiffByRef: Map<IStatePropertyRef, IListDiff>;

  readonly context: IUpdateContext;

  /**
   * 更新したRef情報をキューに追加します。
   * @param ref 更新するStateプロパティの参照情報 (IStatePropertyRef)
   * @param value 新しい値
   */
  enqueueRef(ref: IStatePropertyRef): void;
  beginUpdate(loopContext: ILoopContext | null, callback: (state: IWritableStateProxy) => Promise<void>): Promise<void>;
  createReadonlyStateProxy(): IReadonlyStateProxy;
  createPropertyAccessor(): IPropertyAccessor;
}

/**
 * レンダラー
 */
export interface IRenderer {
  /**
   * Updaterのバージョン
   */
  version: number;
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
  readonly readonlyState: IReadonlyStateProxy;

  readonly updater: IUpdater;
  readonly accessor: IPropertyAccessor;

  /**
   * レンダリング開始
   * @param items 更新情報の配列
   */
  render(items: IStatePropertyRef[]): void;

}

export interface IUpdateContext {
  getValue(state: IStateProxy, ref: IStatePropertyRef): any;
  forceUpdateCache(state: IStateProxy, ref: IStatePropertyRef): void;
  setValue(state: IStateProxy, ref: IStatePropertyRef, value: any): void;
  getListIndexes(state: IStateProxy, ref: IStatePropertyRef): IListIndex[] | null;
  getListAndIndexes(state: IStateProxy, ref: IStatePropertyRef): [ any[] | null, IListIndex[] | null, any[] | null ];
  getBindings(state: IStateProxy, ref: IStatePropertyRef): IBinding[];
  calcListDiff(state: IStateProxy, ref: IStatePropertyRef): IListDiff | null;
  getListDiff(ref: IStatePropertyRef): IListDiff | null;
}

export interface IPropertyAccessor {
  getValue(ref: IStatePropertyRef): any;
  forceUpdateCache(ref: IStatePropertyRef): void;
  setValue(ref: IStatePropertyRef, value: any): void;
  getListIndexes(ref: IStatePropertyRef): IListIndex[] | null;
  getListAndIndexes(ref: IStatePropertyRef): [ any[] | null, IListIndex[] | null, any[] | null ];
  getBindings(ref: IStatePropertyRef): IBinding[];
  calcListDiff(ref: IStatePropertyRef): IListDiff | null;
  getListDiff(ref: IStatePropertyRef): IListDiff | null;
  connectedCallback(): Promise<void>;
  disconnectedCallback(): Promise<void>;
  readonly state: IStateProxy;
}
