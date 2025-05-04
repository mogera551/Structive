import { registerSingleFileComponents } from "./WebComponents/registerSingleFIleComponents.js";
import { bootstrap } from "./bootstrap.js";
import { config as _config } from "./WebComponents/getGlobalConfig.js";
export const config = _config;
let initialized = false;
export async function defineComponents(singleFileComponents) {
    await registerSingleFileComponents(singleFileComponents);
    if (config.autoInit) {
        await bootstrapStructive();
    }
}
export async function bootstrapStructive() {
    if (!initialized) {
        await bootstrap();
        initialized = true;
    }
}
