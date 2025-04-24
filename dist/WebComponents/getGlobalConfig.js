const globalConfig = {
    debug: false,
    locale: "en-US", // The locale of the component, ex. "en-US", default is "en-US"
    enableShadowDom: true,
    enableMainWrapper: true, // Whether to use the main wrapper or not
    enableRouter: true, // Whether to use the router or not
    autoInsertMainWrapper: false, // Whether to automatically insert the main wrapper or not
    autoInit: true, // Whether to automatically initialize the component or not
    mainTagName: "app-main", // The tag name of the main wrapper, default is "app-main"
    routerTagName: "view-router", // The tag name of the router, default is "view-router"
    layoutPath: "", // The path to the layout file, default is ""
};
export function getGlobalConfig() {
    return globalConfig;
}
export const config = getGlobalConfig();
