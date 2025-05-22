import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IStateHandler } from "../types";

export function getLastStatePropertyRef(
  handler: IStateHandler
): IStatePropertyRef | null {
  if (handler.structuredPathInfoStack.length === 0) {
    return null;
  }
  const info = handler.structuredPathInfoStack[handler.structuredPathInfoStack.length - 1];
  if (typeof info === "undefined") {
    return null;
  }
  const listIndex = handler.listIndexStack[handler.listIndexStack.length - 1];
  if (typeof listIndex === "undefined") {
    return null;
  }
  return {info, listIndex};
}
