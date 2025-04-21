export declare class MainWrapper extends HTMLElement {
    constructor();
    connetctedCallback(): Promise<void>;
    get root(): ShadowRoot | HTMLElement;
    loadLayout(): Promise<void>;
    render(): void;
}
