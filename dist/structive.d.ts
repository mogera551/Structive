interface IConfig {
    debug: boolean;
    locale: string;
    enableShadowDom: boolean;
    enableMainWrapper: boolean;
    enableRouter: boolean;
    autoInsertMainWrapper: boolean;
    autoInit: boolean;
    mainTagName: string;
    routerTagName: string;
    layoutPath: string;
}

declare const config: IConfig;
declare function defineComponents(singleFileComponents: Record<string, string>): Promise<void>;
declare function bootstrapStructive(): void;

export { bootstrapStructive, config, defineComponents };
