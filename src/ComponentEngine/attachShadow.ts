import { raiseError } from "../utils";
import { IComponentConfig } from "../WebComponents/types";
import { canHaveShadowRoot } from "./canHaveShadowRoot";

function getParentShadowRoot(parentNode: Node | null): ShadowRoot|undefined{
  let node: Node | null = parentNode;
  while(node) {
    if (node instanceof ShadowRoot) {
      return node;
    }
    node = node.parentNode;
  }
}

export function attachShadow(element: HTMLElement, config: IComponentConfig, styleSheet: CSSStyleSheet): void {
    if (config.enableShadowDom) {
      if (config.extends === null || canHaveShadowRoot(config.extends)) {
        const shadowRoot = element.attachShadow({ mode: 'open' });
        shadowRoot.adoptedStyleSheets = [styleSheet];
      } else {
        raiseError(`ComponentEngine: Shadow DOM not supported for builtin components that extend ${config.extends}`);
      }
    } else {
      const shadowRootOrDocument = getParentShadowRoot(element.parentNode) || document;
      const styleSheets = shadowRootOrDocument.adoptedStyleSheets;
      if (!styleSheets.includes(styleSheet)) {
        shadowRootOrDocument.adoptedStyleSheets = [...styleSheets, styleSheet];
      }
    }

}