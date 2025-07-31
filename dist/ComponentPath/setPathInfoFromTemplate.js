import { getListPathsSetById, getPathsSetById } from "../BindingBuilder/registerDataBindAttributes";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
export function setPathInfoFromTemplate(pathManager, templateId) {
    const paths = getPathsSetById(templateId);
    for (const path of paths) {
        const info = getStructuredPathInfo(path);
        for (const subPath of info.cumulativePathSet) {
            if (pathManager.existsPathInfo(subPath)) {
                continue; // 既に存在するパスはスキップ
            }
            const pathInfo = pathManager.getPathInfo(subPath);
            pathInfo.existsUI = true;
            pathManager.pathInfos.set(subPath, pathInfo);
            pathManager.UIs.add(subPath);
        }
    }
    const listPaths = getListPathsSetById(templateId);
    for (const path of listPaths) {
        const pathInfo = pathManager.getPathInfo(path);
        pathInfo.isList = true;
        pathManager.pathInfos.set(path, pathInfo);
        pathManager.lists.add(path);
        pathManager.elements.add(path + '.*');
    }
}
