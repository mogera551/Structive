import { BindParentComponentSymbol, GetPropertyValueFromChildSymbol, NamesSymbol, RenderSymbol, SetPropertyValueFromChildSymbol } from "./symbols.js";
/**
 * ComponentState関連の型定義ファイル。
 *
 * - Structiveコンポーネントの状態管理・プロキシ・ハンドラのインターフェースを定義
 * - 親コンポーネントとのバインディングやレンダリング、プロパティアクセスの型安全性を担保
 */

/**
 * IComponentState
 * - コンポーネント状態の基本的な操作（レンダリング、親バインディング、プロパティ取得・設定）を定義
 */
export interface IComponentState {
  readonly names: Set<string>;
  render(name: string, value: any): void;
  bindParentComponent(): void;
  getPropertyValue(name: string): any;
  setPropertyValue(name: string, value: any): void;
  getPropertyValueFromChild(name: string): any;
  setPropertyValueFromChild(name: string, value: any): void;
}

/**
 * IComponentStateHandler
 * - Proxyハンドラとして、get/setトラップの型を定義
 */
export interface IComponentStateHandler {
  get(state: IComponentState, prop: PropertyKey, receiver: IComponentState): any;
  set(state: IComponentState, prop: PropertyKey, value: any, receiver: IComponentState): boolean;
}

/**
 * IComponentStateProxy
 * - Proxyラップされた状態オブジェクトの型
 * - 任意のプロパティアクセスや、特殊シンボルによるメソッド呼び出しも許可
 */
export interface IComponentStateProxy extends IComponentState {
  [key:string]: any;
  [RenderSymbol]: (name: string, value: any) => void;
  [BindParentComponentSymbol]: () => void;
  [NamesSymbol]: Set<string>;
  [GetPropertyValueFromChildSymbol]: (name: string) => any;
  [SetPropertyValueFromChildSymbol]: (name: string, value: any) => void;
}
