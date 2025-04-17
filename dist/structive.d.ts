interface IConfig {
    debug: boolean;
    locale: string;
    enableShadowDom: boolean;
}

declare function registerSingleFileComponents(singleFileComponents: Record<string, string>): void;
declare const defineComponents: typeof registerSingleFileComponents;
declare function getGlobalConfig(): IConfig;

export { defineComponents, getGlobalConfig, registerSingleFileComponents };
