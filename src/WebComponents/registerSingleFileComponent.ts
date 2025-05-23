/**
 * registerSingleFileComponent.ts
 *
 * 指定パスのシングルファイルコンポーネント（SFC）を読み込み、StructiveのWeb Componentsとして登録するユーティリティ関数です。
 *
 * 主な役割:
 * - loadSingleFileComponentでSFCファイルを非同期で取得・パース
 * - createComponentClassでWeb Componentsクラスを生成
 * - registerComponentClassで指定タグ名でカスタム要素として登録
 *
 * 設計ポイント:
 * - 非同期処理で動的なコンポーネント登録に対応
 * - SFCのパースから登録までを一括で実行し、簡潔なAPIを提供
 */
import { createComponentClass } from "./createComponentClass.js";
import { loadSingleFileComponent } from "./loadSingleFileComponent.js";
import { registerComponentClass } from "./registerComponentClass.js";

export async function registerSingleFileComponent(tagName: string, path: string):Promise<void> {
  const componentData = await loadSingleFileComponent(path);
  const componentClass = createComponentClass(componentData);
  registerComponentClass(tagName, componentClass);
}