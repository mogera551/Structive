import { createComponentClass } from "./createComponentClass";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";
import { SingleFileComponents } from "./types";

export async function registerSingleFileComponents(singleFileComponents:SingleFileComponents):Promise<void> {
  const promises = Promise.all(Object.entries(singleFileComponents).map(async ([tagName, path]) => {
    const componentData = await loadSingleFileComponent(path);
    const componentClass = createComponentClass(componentData);
    registerComponentClass(tagName, componentClass);
  }));
  await promises;
}