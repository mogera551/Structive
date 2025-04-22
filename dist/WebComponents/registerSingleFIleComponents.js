import { entryRoute } from "../Router/Router";
import { createComponentClass } from "./createComponentClass";
import { config } from "./getGlobalConfig";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";
export async function registerSingleFileComponents(singleFileComponents) {
    const promises = Promise.all(Object.entries(singleFileComponents).map(async ([tagName, path]) => {
        if (config.enableRouter) {
            entryRoute(tagName, path); // routing
        }
        const componentData = await loadSingleFileComponent(path);
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    }));
    await promises;
}
