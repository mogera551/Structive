/**
 * loadImportmap.ts
 *
 * HTML内の<script type="importmap">タグからimportmap情報を取得・統合するユーティリティ関数です。
 *
 * 主な役割:
 * - 複数のimportmapスクリプトタグを走査し、全てのimportsをマージしてIImportMap型で返却
 *
 * 設計ポイント:
 * - scriptタグのinnerHTMLをJSON.parseでパースし、importsプロパティを統合
 * - importmap.importsが複数存在する場合もObject.assignでマージ
 * - importmap仕様に準拠し、柔軟なimportエイリアス管理を実現
 */
import { IImportMap } from "./types";

export function loadImportmap():IImportMap {
  const importmap: IImportMap = {};
  document.querySelectorAll("script[type='importmap']").forEach(script => {
    const scriptImportmap = JSON.parse(script.innerHTML);
    if (scriptImportmap.imports) {
      importmap.imports = Object.assign(importmap.imports || {}, scriptImportmap.imports);
    }
  });
  return importmap;
}

