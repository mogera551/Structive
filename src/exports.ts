import { registerSingleFileComponents } from "./WebComponents/registerSingleFIleComponents.js";
import { bootstrap } from "./bootstrap.js";
import { config as _config } from "./WebComponents/getGlobalConfig.js";
import { IConfig } from "./WebComponents/types";

export const config: IConfig = _config;

let initialized = false;
export async function defineComponents(singleFileComponents: Record<string, string>):Promise<void> {
  await registerSingleFileComponents(singleFileComponents);
  if (config.autoInit) {
    bootstrapStructive();
  }
}

export function bootstrapStructive() {
  if (!initialized) {
    bootstrap();
    initialized = true;
  }
}

