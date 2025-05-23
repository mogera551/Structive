/**
 * registerStyleSheet.ts
 *
 * CSSStyleSheetインスタンスをIDで登録・取得するための管理モジュールです。
 *
 * 主な役割:
 * - styleSheetById: IDをキーにCSSStyleSheetインスタンスを管理するレコード
 * - registerStyleSheet: 指定IDでCSSStyleSheetインスタンスを登録
 * - getStyleSheetById: 指定IDのCSSStyleSheetインスタンスを取得（未登録時はエラーを投げる）
 *
 * 設計ポイント:
 * - グローバルにCSSStyleSheetインスタンスを一元管理し、ID経由で高速にアクセス可能
 * - 存在しないIDアクセス時はraiseErrorで明確な例外を発生
 */
import { raiseError } from "../utils.js";

const styleSheetById: Record<number,CSSStyleSheet> = {};

export function registerStyleSheet(id: number, css: CSSStyleSheet) {
  styleSheetById[id] = css;
}

export function getStyleSheetById(id: number): CSSStyleSheet {
  return styleSheetById[id] ?? raiseError(`getStyleSheetById: stylesheet not found: ${id}`);
}