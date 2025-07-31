import { IStructiveState } from "../StateClass/types";
import { IComponentPathManager } from "./types";

export function setPathInfoFromState(
  pathManager: IComponentPathManager, 
  stateClass: IStructiveState
): void {
  // stateから必要な情報を抽出してpathManagerに設定する処理
  let currentProto = stateClass.prototype;
  while (currentProto && currentProto !== Object.prototype) {
    const trackedGetters = Object.getOwnPropertyDescriptors(currentProto);
    for (const [key, desc] of Object.entries(trackedGetters)) {
      if ((desc as PropertyDescriptor).get === undefined) continue; // getterがない場合はスキップ
      const pathInfo = pathManager.getPathInfo(key);
      pathInfo.withGetter = (desc as PropertyDescriptor).get !== undefined;
      pathInfo.withSetter = (desc as PropertyDescriptor).set !== undefined;
      pathInfo.isTracked = pathInfo.withGetter;
      pathManager.pathInfos.set(key, pathInfo);
      if (pathInfo.withGetter) {
        pathManager.getters.add(key);
        pathManager.trackedGetters.add(key);
        if (pathInfo.withSetter) {
          pathManager.setters.add(key);
        }
      }
    }
    currentProto = Object.getPrototypeOf(currentProto);
  }
}
