/**
 * bootstrap.ts
 *
 * Structiveアプリケーションの初期化処理を行うエントリーポイントです。
 *
 * 主な役割:
 * - グローバル設定(config)に従い、必要なコンポーネントやルーター、メインラッパーを登録・初期化
 * - autoLoadFromImportMapが有効な場合はimportmapからルートやコンポーネントを動的ロード
 * - enableRouterが有効な場合はRouterコンポーネントをカスタム要素として登録
 * - enableMainWrapperが有効な場合はMainWrapperをカスタム要素として登録し、autoInsertMainWrapperが有効ならbodyに自動挿入
 *
 * 設計ポイント:
 * - 設定値に応じて初期化処理を柔軟に制御
 * - importmapやカスタム要素の登録、DOMへの自動挿入など、Structiveの起動に必要な処理を一元化
 */
import { MainWrapper } from "./MainWrapper/MainWrapper.js";
import { Router } from "./Router/Router.js";
import { config } from "./WebComponents/getGlobalConfig.js";
import { loadFromImportMap } from "./WebComponents/loadFromImportMap.js";
export async function bootstrap() {
    if (config.autoLoadFromImportMap) {
        await loadFromImportMap();
    }
    if (config.enableRouter) {
        customElements.define(config.routerTagName, Router);
    }
    if (config.enableMainWrapper) {
        customElements.define(config.mainTagName, MainWrapper);
        if (config.autoInsertMainWrapper) {
            const mainWrapper = document.createElement(config.mainTagName);
            document.body.appendChild(mainWrapper);
        }
    }
}
