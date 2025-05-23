/**
 * loadFromImportMap.ts
 *
 * importmapの情報をもとに、Structiveのルートやコンポーネントを動的にロード・登録するユーティリティです。
 *
 * 主な役割:
 * - importmap.imports内のエイリアスを走査し、@routes/や@components/のプレフィックスで判定
 * - @routes/の場合はルーティング情報をentryRouteで登録
 * - @components/の場合はloadSingleFileComponentでSFCをロードし、createComponentClassでクラス化してregisterComponentClassで登録
 *
 * 設計ポイント:
 * - importmapのエイリアスを利用して、ルーティングやコンポーネントの自動登録を実現
 * - パスやタグ名の正規化、パラメータ除去なども自動で処理
 * - 非同期でSFCをロードし、動的なWeb Components登録に対応
 */
import { entryRoute } from "../Router/Router";
import { createComponentClass } from "./createComponentClass";
import { loadImportmap } from "./loadImportmap";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";
const ROUTES_KEY = "@routes/";
const COMPONENTS_KEY = "@components/";
export async function loadFromImportMap() {
    const importmap = loadImportmap();
    if (importmap.imports) {
        for (const [alias, value] of Object.entries(importmap.imports)) {
            let tagName;
            if (alias.startsWith(ROUTES_KEY)) {
                const path = alias.slice(ROUTES_KEY.length - 1); // remove the prefix '@routes'
                const pathWithoutParams = path.replace(/:[^\s/]+/g, ""); // remove the params
                tagName = "routes" + pathWithoutParams.replace(/\//g, "-"); // replace '/' with '-'
                entryRoute(tagName, path === "/root" ? "/" : path); // routing
            }
            if (alias.startsWith(COMPONENTS_KEY)) {
                tagName = alias.slice(COMPONENTS_KEY.length - 1); // remove the prefix '@components'
            }
            if (!tagName) {
                continue;
            }
            let componentData = null;
            componentData = await loadSingleFileComponent(alias);
            const componentClass = createComponentClass(componentData);
            registerComponentClass(tagName, componentClass);
        }
    }
}
