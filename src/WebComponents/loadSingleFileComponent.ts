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
import { IUserComponentData } from "./types";

export async function loadSingleFileComponent(path: string): Promise<IUserComponentData> {
  // Node/Vitest 等の SSR 環境では import.meta.resolve が存在しない場合があるためフォールバック
  const resolved = (import.meta as any).resolve ? (import.meta as any).resolve(path) : path;
  const response = await fetch(resolved);
  const text = await response.text();
  return createSingleFileComponent(text);
}
