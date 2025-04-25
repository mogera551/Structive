import { createComponentClass } from "./createComponentClass.js";
import { loadSingleFileComponent } from "./loadSingleFileComponent.js";
import { registerComponentClass } from "./registerComponentClass.js";

export async function registerSingleFileComponent(tagName: string, path: string):Promise<void> {
  const componentData = await loadSingleFileComponent(path);
  const componentClass = createComponentClass(componentData);
  registerComponentClass(tagName, componentClass);
}