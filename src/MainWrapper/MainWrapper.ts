import { raiseError } from "../utils";
import { config } from "../WebComponents/getGlobalConfig";

export class MainWrapper extends HTMLElement {
  constructor() {
    super();
    if (config.enableShadowDom) {
      this.attachShadow({ mode: 'open' });
    }
  }

  async connetctedCallback() {
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
        raiseError(`Failed to load layout from ${config.layoutPath}`);
      }
    } else {
      this.root.innerHTML = `<slot name="router"></slot>`;
    }
  }

  render() {
    // add router
    if (config.enableRouter) {
      const router = document.createElement(config.routerTagName);
      router.setAttribute('slot', 'router');
      this.root.appendChild(router);
    }
  }
}
