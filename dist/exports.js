import { registerSingleFileComponents } from "./WebComponents/registerSingleFIleComponents";
import { bootstrap } from "./bootstrap";
import { config as _config } from "./WebComponents/getGlobalConfig";
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
