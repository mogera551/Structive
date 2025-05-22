import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

export function setStatePropertyRef(
  handler: IStateHandler,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  callback: () => void
): void {
  handler.structuredPathInfoStack.push(info);
  handler.listIndexStack.push(listIndex);
  try {
    return callback();
  } finally {
    handler.structuredPathInfoStack.pop();
    handler.listIndexStack.pop();
  }
}
