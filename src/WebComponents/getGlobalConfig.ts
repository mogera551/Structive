/**
 * getGlobalConfig.ts
 *
 * Structive全体で利用するグローバル設定（IConfig）を定義・取得するユーティリティです。
 *
 * 主な役割:
 * - globalConfig: デフォルトのグローバル設定値（debug, locale, enableShadowDom等）を定義
 * - getGlobalConfig: グローバル設定オブジェクトを返す関数
 * - config: getGlobalConfig()のエイリアスとして即時取得用にエクスポート
 *
 * 設計ポイント:
 * - コンポーネント全体で共通利用する設定値を一元管理
 * - デフォルト値を明示し、拡張やカスタマイズにも対応しやすい設計
 */
import { IConfig } from "./types";

const globalConfig: IConfig = {
  "debug"                : false,
  "locale"               : "en-US", // The locale of the component, ex. "en-US", default is "en-US"
  "enableShadowDom"      : true, // Whether to use Shadow DOM or not
  "enableMainWrapper"    : true, // Whether to use the main wrapper or not
  "enableRouter"         : true, // Whether to use the router or not
  "autoInsertMainWrapper": false, // Whether to automatically insert the main wrapper or not
  "autoInit"             : true, // Whether to automatically initialize the component or not
  "mainTagName"          : "app-main", // The tag name of the main wrapper, default is "app-main"
  "routerTagName"        : "view-router", // The tag name of the router, default is "view-router"
  "layoutPath"           : "", // The path to the layout file, default is ""
  "autoLoadFromImportMap": false, // Whether to automatically load the component from the import map or not
  "optimizeList"         : true, // Whether to optimize the list or not
  "optimizeListElements" : true, // Whether to optimize the list elements or not
  "optimizeAccessor"     : true, // Whether to optimize the accessors or not
};


export function getGlobalConfig():IConfig {
  return globalConfig;
}

export const config = getGlobalConfig();
