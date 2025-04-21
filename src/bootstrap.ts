import { MainWrapper } from "./MainWrapper/MainWrapper";
import { Router } from "./Router/Router";
import { config } from "./WebComponents/getGlobalConfig";

export function bootstrap(): void {
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