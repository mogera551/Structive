import { config } from "../WebComponents/getGlobalConfig";

class MainWrapper extends HTMLElement {
  constructor() {
    super();
    if (config.enableShadowDom) {
      this.attachShadow({ mode: 'open' });
    }
  }
}
