import { registerSingleFileComponents } from "./WebComponents/registerSingleFIleComponents.js";
import { bootstrap } from "./bootstrap.js";
import { config as _config } from "./WebComponents/getGlobalConfig.js";
export const config = _config;
let initialized = false;
export async function defineComponents(singleFileComponents) {
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
