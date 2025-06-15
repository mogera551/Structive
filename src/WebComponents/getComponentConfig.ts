/**
 * getComponentConfig.ts
 *
 * ユーザー設定（IUserConfig）とグローバル設定を統合し、コンポーネントの設定（IComponentConfig）を生成するユーティリティ関数です。
 *
 * 主な役割:
 * - getGlobalConfigでグローバル設定を取得
 * - ユーザー設定が優先され、未指定の場合はグローバル設定値を利用
 * - enableShadowDomやextendsなどの設定値を一元的に返却
 *
 * 設計ポイント:
 * - ユーザーごとの個別設定と全体のデフォルト設定を柔軟に統合
 * - 設定値のデフォルト化や拡張性を考慮した設計
 */
import { getGlobalConfig } from "./getGlobalConfig.js";
import { IUserConfig, IComponentConfig } from "./types";

export function getComponentConfig(userConfig: IUserConfig): IComponentConfig {
  const globalConfig = getGlobalConfig();
  return {
    enableWebComponents: typeof userConfig.enableWebComponents === "undefined" ? true : userConfig.enableWebComponents,
    enableShadowDom    : userConfig.enableShadowDom ?? globalConfig.enableShadowDom,
    extends            : userConfig.extends ?? null,
  };
}