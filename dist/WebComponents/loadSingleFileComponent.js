/**
 * loadSingleFileComponent.ts
 *
 * 指定パスのシングルファイルコンポーネント（SFC）をfetchし、パースしてIUserComponentDataとして返すユーティリティ関数です。
 *
 * 主な役割:
 * - fetchで指定パスのSFCファイルを取得
 * - テキストとして読み込み、createSingleFileComponentでパース
 * - パース結果（IUserComponentData）を返却
 *
 * 設計ポイント:
 * - import.meta.resolveを利用し、パス解決の柔軟性を確保
 * - 非同期処理で動的なコンポーネントロードに対応
 */
import { createSingleFileComponent } from "./createSingleFileComponent.js";
export async function loadSingleFileComponent(path) {
    const response = await fetch(import.meta.resolve(path));
    const text = await response.text();
    return createSingleFileComponent(text);
}
