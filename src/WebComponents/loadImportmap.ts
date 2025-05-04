import { IImportMap } from "./types";

export function loadImportmap():IImportMap {
  const importmap: IImportMap = {};
  document.querySelectorAll("script[type='importmap']").forEach(script => {
    const scriptImportmap = JSON.parse(script.innerHTML);
    if (scriptImportmap.imports) {
      importmap.imports = Object.assign(importmap.imports || {}, scriptImportmap.imports);
    }
  });
  return importmap;
}

