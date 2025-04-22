import { IStateHandler } from "../types";

export async function setCacheable(handler: IStateHandler, callback: () => Promise<void>): Promise<void> {
  handler.cacheable = true;
  handler.cache = {}
  try {
    await callback();
  } finally {
    handler.cacheable = false;
  }
}
