import { entryRoute } from "../Router/Router";
import { createComponentClass } from "./createComponentClass";
import { config } from "./getGlobalConfig";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";
export async function registerSingleFileComponents(singleFileComponents) {
    const promises = Promise.all(Object.entries(singleFileComponents).map(async ([tagName, path]) => {
        let componentData = null;
        if (config.enableRouter) {
            const routePath = path.startsWith("@routes") ? path.slice(7) : path; // remove the prefix 'routes:'
            entryRoute(tagName, routePath === "/root" ? "/" : routePath); // routing
            componentData = await loadSingleFileComponent("@routes" + (routePath === "/" ? "/root" : routePath));
        }
        else {
            componentData = await loadSingleFileComponent(path);
        }
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    }));
    await promises;
}
