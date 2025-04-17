import { createSingleFileComponent } from "./createSingleFileComponent";
import { IUserComponentData } from "./types";

export async function loadSingleFileComponent(path: string): Promise<IUserComponentData> {
  const response = await fetch(import.meta.resolve(path));
  const text = await response.text();
  return createSingleFileComponent(text);
}
