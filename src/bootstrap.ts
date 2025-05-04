import { MainWrapper } from "./MainWrapper/MainWrapper.js";
import { Router } from "./Router/Router.js";
import { config } from "./WebComponents/getGlobalConfig.js";
import { loadFromImportMap } from "./WebComponents/loadFromImportMap.js";

export async function bootstrap(): Promise<void> {
  if (config.autoLoadFromImportMap) {
    await loadFromImportMap();
  }

  if (config.enableRouter) {
    customElements.define(config.routerTagName, Router);
  }

  if (config.enableMainWrapper) {
    customElements.define(config.mainTagName, MainWrapper);
    if (config.autoInsertMainWrapper) {
      const mainWrapper = document.createElement(config.mainTagName);
      document.body.appendChild(mainWrapper);
    }
  }
}