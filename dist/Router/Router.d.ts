export declare class Router extends HTMLElement {
    _popstateHandler: (event: PopStateEvent) => void;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    popstateHandler(): void;
    render(): void;
}
export declare function entryRoute(tagName: string, routePath: string): void;
