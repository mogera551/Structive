/**
 * regsiterCss.ts
 *
 * CSS文字列をCSSStyleSheetとして生成し、IDで登録するユーティリティ関数です。
 *
 * 主な役割:
 * - CSS文字列からCSSStyleSheetインスタンスを生成
 * - registerStyleSheetを利用して、指定IDでCSSStyleSheetを登録
 *
 * 設計ポイント:
 * - styleSheet.replaceSyncで同期的にCSSを適用
 * - グローバルなスタイル管理や動的スタイル適用に利用可能
 */
import { registerStyleSheet } from "./registerStyleSheet.js";
export function registerCss(id, css) {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    registerStyleSheet(id, styleSheet);
}
