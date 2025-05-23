import { createBindingState } from "../DataBinding/BindingState/BindingState.js";
import { createBindingStateIndex } from "../DataBinding/BindingState/BindingStateIndex.js";
import { CreateBindingStateByStateFn } from "../DataBinding/BindingState/types";
import { IFilterText } from "./types";

const ereg = new RegExp(/^\$\d+$/);

/**
 * バインディング対象の状態プロパティ名とフィルタ情報から、
 * 適切なバインディング状態生成関数（CreateBindingStateByStateFn）を返すユーティリティ。
 *
 * - プロパティ名が "$数字"（例: "$1"）の場合は createBindingStateIndex を使用（インデックスバインディング用）
 * - それ以外は通常の createBindingState を使用
 *
 * @param name        バインディング対象の状態プロパティ名
 * @param filterTexts フィルタ情報
 * @returns           バインディング状態生成関数
 */
export function getBindingStateCreator(
  name       : string, 
  filterTexts: IFilterText[]
): CreateBindingStateByStateFn {
  if (ereg.test(name)) {
    // "$数字"形式の場合はインデックスバインディング用の生成関数を返す
    return createBindingStateIndex(name, filterTexts);
  } else {
    // 通常のプロパティ名の場合は標準の生成関数を返す
    return createBindingState(name, filterTexts);
  }
}