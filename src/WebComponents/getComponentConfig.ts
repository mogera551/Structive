import { getGlobalConfig } from "./getGlobalConfig";
import { IUserConfig, IComponentConfig } from "./types";

export function getComponentConfig(userConfig: IUserConfig): IComponentConfig {
  const globalConfig = getGlobalConfig();
  return {
    enableShadowDom: userConfig.enableShadowDom ?? globalConfig.enableShadowDom,
    extends        : userConfig.extends ?? null,
  };
}