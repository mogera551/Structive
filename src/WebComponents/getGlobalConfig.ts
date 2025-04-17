import { IConfig } from "./types";

const globalConfig: IConfig = {
  debug          : false,
  locale         : "en-US", // The locale of the component, ex. "en-US", default is "en-US"
  enableShadowDom: true,
};

export function getGlobalConfig():IConfig {
  return globalConfig;
}