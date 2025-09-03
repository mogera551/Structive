import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IListIndex2 } from "../../ListIndex2/types";
import { IReadonlyStateProxy, IWritableStateProxy } from "../../StateClass/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IBinding } from "../types";

/**
 * BindingState関連の型定義ファイル。
 *
 * - バインディング状態（BindingState）のインターフェースやファクトリ型を定義
 * - Stateプロパティへのアクセス・フィルタ適用・値の取得/設定・リストインデックス管理などを型安全に扱うための設計
 */

/**
 * IBindingState
 * - バインディング状態（Stateプロパティとバインディング情報の1対1対応）の共通インターフェース
 * - 値の取得（value, filteredValue）、初期化（init）、値の割り当て（assignValue）などのメソッドを提供
 */
export interface IBindingState {
  readonly pattern      : string | never;
  readonly info         : IStructuredPathInfo | never;
  readonly listIndex    : IListIndex2 | null;
  readonly state        : IReadonlyStateProxy;
  readonly filters      : Filters;
  readonly value        : any;
  readonly filteredValue: any;
  init(): void;
  assignValue(writeState:IWritableStateProxy, value:any): void;
}

/**
 * バインディング状態生成ファクトリ型
 * - バインディング名・フィルタ情報からBindingState生成関数を返す
 */
export type CreateBindingStateByStateFn = (binding:IBinding, state: IReadonlyStateProxy, filters: FilterWithOptions) => IBindingState;
export type CreateBindingStateFn = (name: string, filterTexts: IFilterText[]) => CreateBindingStateByStateFn;