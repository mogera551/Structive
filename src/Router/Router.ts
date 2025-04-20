import { config } from "../WebComponents/getGlobalConfig";

const DEFAULT_ROUTE_PATH = '/'; // Default route path
/**
 * example:
 * ```ts
 * entryRoute('my-view', '/my-view/:id');
 */
const routeMap: Record<string,string> = {};

class Router extends HTMLElement {
  _popstateHandler: (event: PopStateEvent) => void;
  constructor() {
    super();
    this._popstateHandler = this.popstateHandler.bind(this);
  }

  connectedCallback() {
    window.addEventListener('popstate', this._popstateHandler);
    window.dispatchEvent(new Event("popstate")); // Dispatch popstate event to trigger the initial render
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._popstateHandler);
  }

  popstateHandler() {
    this.render();
    window.dispatchEvent(new Event('popstate')); // Dispatch popstate event to notify other components
  }

  render() {
    const routePath = window.location.pathname || DEFAULT_ROUTE_PATH;
    let tagName: string | undefined = undefined;
    let params: Record<string, string> = {};
    // Check if the routePath matches any of the defined routes
    for (const [path, tag] of Object.entries(routeMap)) {
      const regex = new RegExp(path.replace(/:[^\s/]+/g, '([^/]+)'));
      if (regex.test(routePath)) {
        tagName = tag;
        // Extract the parameters from the routePath
        const matches = routePath.match(regex);
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
      const customElement = document.createElement(tagName) as HTMLElement;
      customElement.setAttribute('state', JSON.stringify(params));
      this.appendChild(customElement);
    } else {
      this.innerHTML = '<h1>404 Not Found</h1>';
    }
  }
}

if (config.enableRouter) {
  customElements.define(config.routerTagName, Router);
}

export function entryRoute(tagName: string, routePath: string): void {
  routeMap[routePath] = tagName;
}
