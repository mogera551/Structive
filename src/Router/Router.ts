import { config } from "../WebComponents/getGlobalConfig";
import { IRouter } from "./types";

const DEFAULT_ROUTE_PATH = '/'; // Default route path
const ROUTE_PATH_PREFIX = 'routes:'; // Prefix for route paths
/**
 * example:
 * ```ts
 * entryRoute('my-view', '/my-view/:id');
 */
const routeEntries: Array<[string, string]> = [];

let globalRouter : Router | null = null;

export class Router extends HTMLElement implements IRouter {
  _popstateHandler: (event: PopStateEvent) => void;
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

  popstateHandler(event: PopStateEvent) {
    event.preventDefault();
    this.render();
  }

  navigate(to: string) {
    history.pushState({}, '', to);
    this.render();
  }

  render() {
    // スロットコンテントをクリア
    const slotChildren = Array.from(this.childNodes).filter(
      n => (n as HTMLElement).getAttribute?.('slot') === 'content'
    );
    slotChildren.forEach(n => this.removeChild(n));

    const routePath = window.location.pathname || DEFAULT_ROUTE_PATH;
    let tagName: string | undefined = undefined;
    let params: Record<string, string> = {};
    // Check if the routePath matches any of the defined routes
    for (const [path, tag] of routeEntries) {
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
      // If a route matches, create the custom element and set its state
      // Create the custom element with the tag name
      // project the custom element into the router slot
      const customElement = document.createElement(tagName) as HTMLElement;
      customElement.setAttribute('data-state', JSON.stringify(params));
      customElement.setAttribute('slot', 'content');
      this.appendChild(customElement);
    } else {
      // If no route matches, show 404 content
      const messageElement = document.createElement('h1') as HTMLElement;
      messageElement.setAttribute('slot', 'content');
      messageElement.textContent = '404 Not Found';
      this.appendChild(messageElement);
    }
  }

}

export function entryRoute(tagName: string, routePath: string): void {
  if (routePath.startsWith(ROUTE_PATH_PREFIX)) {
    routePath = routePath.substring(ROUTE_PATH_PREFIX.length); // Remove 'routes:' prefix
  }
  routeEntries.push([routePath, tagName]);
}

export function getRouter(): Router | null {
  return globalRouter;
}

