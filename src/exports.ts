/**
 * exports.ts
 *
 * Structiveの主要なエントリーポイント・APIを外部公開するモジュールです。
 *
 * 主な役割:
 * - registerSingleFileComponents, bootstrap, config などの主要APIをエクスポート
 * - defineComponents: SFC群をまとめて登録し、autoInitが有効なら自動で初期化
 * - bootstrapStructive: 初期化処理を一度だけ実行
 *
 * 設計ポイント:
 * - グローバル設定(config)を外部から参照・変更可能
 * - 初期化処理の多重実行を防止し、安全な起動を保証
 */
import { registerSingleFileComponents } from "./WebComponents/registerSingleFIleComponents.js";
import { bootstrap } from "./bootstrap.js";
import { config as _config } from "./WebComponents/getGlobalConfig.js";
import { IConfig } from "./WebComponents/types";

export const config: IConfig = _config;

let initialized = false;
export async function defineComponents(singleFileComponents: Record<string, string>):Promise<void> {
  await registerSingleFileComponents(singleFileComponents);
  if (config.autoInit) {
    await bootstrapStructive();
  }
}

export async function bootstrapStructive():Promise<void> {
  if (!initialized) {
    await bootstrap();
    initialized = true;
  }
}

