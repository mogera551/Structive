import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes";
import { createComponentPathInfo } from "./ComponentPathInfo";
import { IComponentPathManager } from "./types";

export function setPathInfoFromTemplate(
  pathManager: IComponentPathManager,
  templateId: number
): void {
  const paths = getPathsSetById(templateId);
  for(const path of paths) {
    const pathInfo = pathManager.getPathInfo(path);
    pathInfo.existsUI = true;
    pathManager.pathInfos.set(path, pathInfo);
    pathManager.UIs.add(path);
  }

  const listPaths = getListPathsSetById(templateId);
  for(const path of listPaths) {
    const pathInfo = pathManager.getPathInfo(path);
    pathInfo.isList = true;
    pathManager.pathInfos.set(path, pathInfo);
    pathManager.lists.add(path);
  }
}
