/**
 * getBaseClass.ts
 *
 * 指定したタグ名（extendTagName）から、その要素のコンストラクタ（基底クラス）を取得するユーティリティ関数です。
 *
 * 主な役割:
 * - extendTagNameが指定されていれば、そのタグのHTMLElementコンストラクタを返す
 * - 指定がなければHTMLElementを返す
 *
 * 設計ポイント:
 * - カスタム要素の継承元クラスを動的に取得し、柔軟なWeb Components拡張に対応
 */
import { Constructor } from "../types";

export function getBaseClass(extendTagName: string | null):Constructor<HTMLElement> {
  return extendTagName ? (document.createElement(extendTagName).constructor as Constructor<HTMLElement>) : HTMLElement;
}