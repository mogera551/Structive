import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

export function checkDependency(
  handler: IStateHandler,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
): void {
  // 動的依存関係の登録
  if (handler.refIndex >= 0) {
    const lastInfo = handler.structuredPathInfoStack[handler.refIndex];
    if (lastInfo !== null) {
      if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
        !handler.engine.pathManager.setters.has(lastInfo.pattern) &&
        lastInfo.pattern !== info.pattern) {
        handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
      }
    }
  }
}