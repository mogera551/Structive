/**
 * MainWrapper.ts
 *
 * アプリ全体のレイアウトやルーティングを管理するカスタムエレメント MainWrapper の実装です。
 *
 * 主な役割:
 * - Shadow DOMの有効化やレイアウトテンプレートの動的読み込み
 * - レイアウトテンプレートやスタイルの適用
 * - ルーター要素（routerTagName）の動的追加
 *
 * 設計ポイント:
 * - config.enableShadowDom でShadow DOMの有効/無効を切り替え
 * - config.layoutPath が指定されていればfetchでレイアウトHTMLを取得し、テンプレート・スタイルを適用
 * - スタイルはadoptedStyleSheetsでShadowRootまたはdocumentに適用
 * - レイアウトが指定されていない場合はデフォルトのslotを挿入
 * - config.enableRouter が有効な場合はrouter要素をslotに追加
 */
import { raiseError } from "../utils";
import { config } from "../WebComponents/getGlobalConfig";

const SLOT_KEY = "router";
const DEFAULT_LAYOUT = `<slot name="${SLOT_KEY}"></slot>`;

export class MainWrapper extends HTMLElement {
  constructor() {
    super();
    if (config.enableShadowDom) {
      this.attachShadow({ mode: 'open' });
    }
  }

  async connectedCallback() {
    await this.loadLayout();
    this.render();
  }

  get root(): ShadowRoot | HTMLElement {
    return this.shadowRoot ?? this;
  }

  async loadLayout() {
    if (config.layoutPath) {
      const response = await fetch(config.layoutPath);
      if (response.ok) {
        const layoutText = await response.text();
        const workTemplate = document.createElement("template");
        workTemplate.innerHTML = layoutText;
      
        const template = workTemplate.content.querySelector("template");
        const style = workTemplate.content.querySelector("style") as CSSStyleSheet | null;
      
        this.root.appendChild(template?.content ?? document.createDocumentFragment());
        if (style) {
          const shadowRootOrDocument = this.shadowRoot ?? document;
          const styleSheets = shadowRootOrDocument.adoptedStyleSheets;
          if (!styleSheets.includes(style)) {
            shadowRootOrDocument.adoptedStyleSheets = [...styleSheets, style];
          }
        }
      } else {
        raiseError({
          code: 'TMP-101',
          message: `Failed to load layout from ${config.layoutPath}`,
          context: { layoutPath: config.layoutPath },
          docsUrl: '/docs/error-codes.md#tmp',
          severity: 'error',
        });
      }
    } else {
      this.root.innerHTML = DEFAULT_LAYOUT;
    }
  }

  render() {
    // add router
    if (config.enableRouter) {
      const router = document.createElement(config.routerTagName);
      router.setAttribute('slot', SLOT_KEY);
      this.root.appendChild(router);
    }
  }
}
