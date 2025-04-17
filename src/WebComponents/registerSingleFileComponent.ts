import { createComponentClass } from "./createComponentClass";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";

export async function registerSingleFileComponent(tagName: string, path: string):Promise<void> {
  const componentData = await loadSingleFileComponent(path);
  const componentClass = createComponentClass(componentData);
  registerComponentClass(tagName, componentClass);
}