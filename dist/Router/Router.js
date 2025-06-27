/**
 * Router.ts
 *
 * シングルページアプリケーション（SPA）向けのカスタムエレメント Router の実装です。
 *
 * 主な役割:
 * - ルート定義（entryRoute）に基づき、URLパスに応じてカスタム要素を動的に生成・表示
 * - pushState/popstateイベントを利用した履歴管理とルーティング制御
 * - ルートパラメータの抽出とカスタム要素への受け渡し
 * - 404ページ（未定義ルート時）の表示
 *
 * 設計ポイント:
 * - entryRouteでルートパスとカスタム要素タグ名のペアを登録
 * - popstateイベントでURL変更時に自動で再描画
 * - ルートパスのパラメータ（:id等）も正規表現で抽出し、data-state属性で渡す
 * - getRouterでグローバルなRouterインスタンスを取得可能
 */
import { isLazyLoadComponent, loadLazyLoadComponent } from "../WebComponents/loadFromImportMap";
const DEFAULT_ROUTE_PATH = '/'; // Default route path
const ROUTE_PATH_PREFIX = 'routes:'; // Prefix for route paths
/**
 * example:
 * ```ts
 * entryRoute('my-view', '/my-view/:id');
 */
const routeEntries = [];
let globalRouter = null;
export class Router extends HTMLElement {
    originalPathName = window.location.pathname; // Store the original path name
    originalFileName = window.location.pathname.split('/').pop() || ''; // Store the original file name
    basePath = document.querySelector('base')?.href.replace(window.location.origin, "") || DEFAULT_ROUTE_PATH;
    _popstateHandler;
    constructor() {
        super();
        this._popstateHandler = this.popstateHandler.bind(this);
    }
    connectedCallback() {
        globalRouter = this;
        this.innerHTML = '<slot name="content"></slot>';
        window.addEventListener('popstate', this._popstateHandler);
        window.dispatchEvent(new Event("popstate")); // Dispatch popstate event to trigger the initial render
    }
    disconnectedCallback() {
        window.removeEventListener('popstate', this._popstateHandler);
        globalRouter = null;
    }
    popstateHandler(event) {
        event.preventDefault();
        this.render();
    }
    navigate(to) {
        const toPath = to[0] === '/' ? (this.basePath + to.slice(1)) : to; // Ensure the path starts with '/'
        history.pushState({}, '', toPath);
        this.render();
    }
    render() {
        // スロットコンテントをクリア
        const slotChildren = Array.from(this.childNodes).filter(n => n.getAttribute?.('slot') === 'content');
        slotChildren.forEach(n => this.removeChild(n));
        const paths = window.location.pathname.split('/');
        if (paths.at(-1) === this.originalFileName) {
            paths[paths.length - 1] = ''; // Ensure the last path is empty for root
        }
        const pathName = paths.join('/');
        const replacedPath = pathName.replace(this.basePath, ''); // Remove base path and ensure default route
        const currentPath = replacedPath[0] !== '/' ? '/' + replacedPath : replacedPath; // Ensure the path starts with '/'
        let tagName = undefined;
        let params = {};
        // Check if the routePath matches any of the defined routes
        for (const [path, tag] of routeEntries) {
            const regex = new RegExp("^" + path.replace(/:[^\s/]+/g, '([^/]+)') + "$");
            if (regex.test(currentPath)) {
                tagName = tag;
                // Extract the parameters from the routePath
                const matches = currentPath.match(regex);
                if (matches) {
                    const keys = path.match(/:[^\s/]+/g) || [];
                    keys.forEach((key, index) => {
                        params[key.substring(1)] = matches[index + 1]; // +1 to skip the full match
                    });
                }
                break;
            }
        }
        if (tagName) {
            // If a route matches, create the custom element and set its state
            // Create the custom element with the tag name
            // project the custom element into the router slot
            const customElement = document.createElement(tagName);
            customElement.setAttribute('data-state', JSON.stringify(params));
            customElement.setAttribute('slot', 'content');
            this.appendChild(customElement);
            if (isLazyLoadComponent(tagName)) {
                loadLazyLoadComponent(tagName); // Load lazy load component if necessary
            }
        }
        else {
            // If no route matches, show 404 content
            const messageElement = document.createElement('h1');
            messageElement.setAttribute('slot', 'content');
            messageElement.textContent = '404 Not Found';
            this.appendChild(messageElement);
        }
    }
}
export function entryRoute(tagName, routePath) {
    if (routePath.startsWith(ROUTE_PATH_PREFIX)) {
        routePath = routePath.substring(ROUTE_PATH_PREFIX.length); // Remove 'routes:' prefix
    }
    routeEntries.push([routePath, tagName]);
}
export function getRouter() {
    return globalRouter;
}
