import { getGlobalConfig } from "./getGlobalConfig.js";
export function getComponentConfig(userConfig) {
    const globalConfig = getGlobalConfig();
    return {
        enableShadowDom: userConfig.enableShadowDom ?? globalConfig.enableShadowDom,
        extends: userConfig.extends ?? null,
    };
}
