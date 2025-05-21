import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler } from "../types";

export async function asyncSetStatePropertyRef(
  handler: IStateHandler,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  callback: () => Promise<void>
): Promise<void> {
  handler.structuredPathInfoStack.push(info);
  handler.listIndexStack.push(listIndex);
  try {
    await callback();
  } finally {
    handler.structuredPathInfoStack.pop();
    handler.listIndexStack.pop();
  }
}
