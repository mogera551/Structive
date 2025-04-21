import { IStructiveState } from "../StateClass/types";
import { IUserComponentData } from "./types";

function escapeEmbed(html: string): string {
  return html.replaceAll(/\{\{([^\}]+)\}\}/g, (match, expr) => {
    return `<!--{{${expr}}}-->`;
  });
}

function unescapeEmbed(html:string):string {
  return html.replaceAll(/<!--\{\{([^\}]+)\}\}-->/g, (match, expr) => {
    return `{{${expr}}}`;
  });
}

export async function createSingleFileComponent(text: string): Promise<IUserComponentData> {
  const template = document.createElement("template");
  template.innerHTML = escapeEmbed(text);

  const html = template.content.querySelector("template");
  html?.remove();

  const script = template.content.querySelector("script");
  const scriptModule = script ? await import("data:text/javascript;charset=utf-8," + script.text) : {};
  script?.remove();

  const style = template.content.querySelector("style");
  style?.remove();

  const stateClass = (scriptModule.default ?? class {}) as IStructiveState;
  
  return {
    text,
    html      : unescapeEmbed(html?.innerHTML ?? "").trim(),
    css       : style?.textContent ?? "",
    stateClass,
  }
}