import { IStateHandler } from "../types";

export function setCacheable(handler: IStateHandler, callback: () => void): void {
  handler.cacheable = true;
  handler.cache = {}
  try {
    callback();
  } finally {
    handler.cacheable = false;
  }
}
