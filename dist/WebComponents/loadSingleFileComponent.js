import { createSingleFileComponent } from "./createSingleFileComponent";
export async function loadSingleFileComponent(path) {
    const response = await fetch(import.meta.resolve(path));
    const text = await response.text();
    return createSingleFileComponent(text);
}
