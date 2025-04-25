const DEFAULT_ROUTE_PATH = '/'; // Default route path
const ROUTE_PATH_PREFIX = 'routes:'; // Prefix for route paths
/**
 * example:
 * ```ts
 * entryRoute('my-view', '/my-view/:id');
 */
const routeMap: Record<string,string> = {};

export class Router extends HTMLElement {
  _popstateHandler: (event: PopStateEvent) => void;
  constructor() {
    super();
    this._popstateHandler = this.popstateHandler.bind(this);
  }

  connectedCallback() {
    this.innerHTML = '<slot name="content"></slot>';
    window.addEventListener('popstate', this._popstateHandler);
    window.dispatchEvent(new Event("popstate")); // Dispatch popstate event to trigger the initial render
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._popstateHandler);
  }

  popstateHandler(event: PopStateEvent) {
    this.render();
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
      // If a route matches, create the custom element and set its state
      // Create the custom element with the tag name
      // project the custom element into the router slot
      const customElement = document.createElement(tagName) as HTMLElement;
      customElement.setAttribute('state', JSON.stringify(params));
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
  routeMap[routePath] = tagName;
}


