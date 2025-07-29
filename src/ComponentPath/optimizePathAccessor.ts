import { IStructiveState } from "../StateClass/types";
import { createAccessorFunctions } from "../StateProperty/createAccessorFunctions";
import { config as globalConfig } from "../WebComponents/getGlobalConfig";
import { IComponentPathManager } from "./types";

export function optimizePathAccessor(
  pathManager: IComponentPathManager,
  stateClass: IStructiveState
): void {
  if (globalConfig.optimizeAccessor === false) {
    // アクセサの最適化が無効化されている場合は何もしない
    return;
  }
  for(const pathInfo of pathManager.pathInfos.values()) {
    // 最適化処理を実装
    if (pathInfo.info.pathSegments.length === 1) {
      // 単一セグメントのパスは最適化しない
      continue;
    }
    if (pathInfo.withGetter) {
      // 既にgetterが存在する場合は最適化しない
      continue;
    }

    pathInfo.optimized = true; // 最適化フラグを立てる

    // 最適化されたアクセサを作成
    const funcs = createAccessorFunctions(pathInfo.info, pathManager.getters);
    Object.defineProperty(stateClass.prototype, pathInfo.path, {
      get: funcs.get,
      set: funcs.set,
      enumerable: true,
      configurable: true,
    });
  }

}
