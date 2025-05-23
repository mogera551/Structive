/**
 * registerSingleFileComponents.ts
 *
 * 複数のシングルファイルコンポーネント（SFC）をまとめてStructiveのWeb Componentsとして登録するユーティリティ関数です。
 *
 * 主な役割:
 * - singleFileComponents（tagNameとパスのマップ）を走査し、各SFCを非同期で取得・パース
 * - enableRouterが有効な場合はentryRouteでルーティング情報も登録
 * - createComponentClassでWeb Componentsクラスを生成し、registerComponentClassでカスタム要素として登録
 *
 * 設計ポイント:
 * - SFCのロードからWeb Components登録、ルーティング登録までを一括で自動化
 * - 非同期処理で複数コンポーネントの動的登録に対応
 * - ルートパス"/root"の正規化や、@routesプレフィックスの除去など柔軟なパス処理
 */
import { entryRoute } from "../Router/Router.js";
import { createComponentClass } from "./createComponentClass.js";
import { config } from "./getGlobalConfig.js";
import { loadSingleFileComponent } from "./loadSingleFileComponent.js";
import { registerComponentClass } from "./registerComponentClass.js";
export async function registerSingleFileComponents(singleFileComponents) {
    for (const [tagName, path] of Object.entries(singleFileComponents)) {
        let componentData = null;
        if (config.enableRouter) {
            const routePath = path.startsWith("@routes") ? path.slice(7) : path; // remove the prefix 'routes:'
            entryRoute(tagName, routePath === "/root" ? "/" : routePath); // routing
        }
        componentData = await loadSingleFileComponent(path);
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    }
}
