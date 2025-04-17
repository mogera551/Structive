import { IConfig } from "./WebComponents/types";
export declare function registerSingleFileComponents(singleFileComponents: Record<string, string>): void;
export declare const defineComponents: typeof registerSingleFileComponents;
export declare function getGlobalConfig(): IConfig;
