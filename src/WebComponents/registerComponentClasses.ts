/**
 * registerComponentClasses.ts
 *
 * 複数のStructive Web Componentsクラスをまとめてカスタム要素として登録するユーティリティ関数です。
 *
 * 主な役割:
 * - 渡されたcomponentClasses（tagNameとcomponentClassのマップ）を走査し、各クラスをdefineメソッドで登録
 *
 * 設計ポイント:
 * - 複数コンポーネントの一括登録を簡潔に実現し、再利用性・保守性を向上
 */
import { StructiveComponentClasses } from "./types";

export function registerComponentClasses(componentClasses:StructiveComponentClasses) {
  Object.entries(componentClasses).forEach(([tagName, componentClass]) => {
    componentClass.define(tagName);
  });
}