import { registerSingleFileComponents as _registerSingleFileComponents } from "./WebComponents/registerSingleFIleComponents";
import { getGlobalConfig as _getGlobalConfig } from "./WebComponents/getGlobalConfig";
import { IConfig } from "./WebComponents/types";

export function registerSingleFileComponents(singleFileComponents: Record<string, string>) {
  _registerSingleFileComponents(singleFileComponents);
}

export const defineComponents = registerSingleFileComponents;

export function getGlobalConfig(): IConfig {
  return _getGlobalConfig();
}

