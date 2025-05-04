import { createComponentClass } from "./createComponentClass";
import { loadImportmap } from "./loadImportmap";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";
const ROUTES_KEY = "@routes/";
const COMPONENTS_KEY = "@components/";
export async function loadFromImportMap() {
    const importmap = loadImportmap();
    if (importmap.imports) {
        for (const [alias, value] of Object.entries(importmap.imports)) {
            let tagName;
            if (alias.startsWith(ROUTES_KEY)) {
                const path = alias.slice(ROUTES_KEY.length - 1); // remove the prefix '@routes'
                tagName = "routes-" + path.replace(/\//g, "-"); // replace '/' with '-'
            }
            if (alias.startsWith(COMPONENTS_KEY)) {
                tagName = alias.slice(COMPONENTS_KEY.length - 1); // remove the prefix '@components'
            }
            if (!tagName) {
                continue;
            }
            let componentData = null;
            componentData = await loadSingleFileComponent(alias);
            const componentClass = createComponentClass(componentData);
            registerComponentClass(tagName, componentClass);
        }
    }
}
