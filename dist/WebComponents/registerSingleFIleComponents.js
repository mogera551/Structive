import { entryRoute } from "../Router/Router.js";
import { createComponentClass } from "./createComponentClass.js";
import { config } from "./getGlobalConfig.js";
import { loadSingleFileComponent } from "./loadSingleFileComponent.js";
import { registerComponentClass } from "./registerComponentClass.js";
export async function registerSingleFileComponents(singleFileComponents) {
    for (const [tagName, path] of Object.entries(singleFileComponents)) {
        let componentData = null;
        if (config.enableRouter) {
            const routePath = path.startsWith("@routes") ? path.slice(7) : path; // remove the prefix 'routes:'
            entryRoute(tagName, routePath === "/root" ? "/" : routePath); // routing
        }
        componentData = await loadSingleFileComponent(path);
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    }
}
