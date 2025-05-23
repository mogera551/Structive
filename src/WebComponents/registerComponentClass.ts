/**
 * registerComponentClass.ts
 *
 * StructiveのWeb Componentsクラスを指定したタグ名でカスタム要素として登録するユーティリティ関数です。
 *
 * 主な役割:
 * - registerComponentClass: 渡されたcomponentClassをtagNameでdefineメソッドを使って登録
 *
 * 設計ポイント:
 * - Web Componentsのカスタム要素登録を簡潔にラップし、再利用性を高める設計
 */
import { StructiveComponentClass } from "./types";

export function registerComponentClass(tagName: string, componentClass: StructiveComponentClass) {
  componentClass.define(tagName);
}