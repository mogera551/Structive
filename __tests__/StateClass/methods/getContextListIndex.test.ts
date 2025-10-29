import { describe, it, expect, vi } from "vitest";
import { getContextListIndex } from "../../../src/StateClass/methods/getContextListIndex";

function makeHandler(ref: any) {
  return { lastRefStack: ref, refStack: [ref], refIndex: 0 } as any;
}

describe("StateClass/methods getContextListIndex", () => {
  it("ref が存在しない場合は null", () => {
    const handler = { lastRefStack: null, refStack: [], refIndex: 0 } as any;
    const r = getContextListIndex(handler, "a.*.b");
    expect(r).toBeNull();
  });

  it("ref.info が null の場合は null", () => {
    const handler = makeHandler({ info: null, listIndex: { at: vi.fn() } });
    const r = getContextListIndex(handler, "a.*.b");
    expect(r).toBeNull();
  });

  it("ref.listIndex が null の場合は null", () => {
    const handler = makeHandler({ info: { indexByWildcardPath: {} }, listIndex: null });
    const r = getContextListIndex(handler, "a.*.b");
    expect(r).toBeNull();
  });

  it("indexByWildcardPath に対象パスが無い場合は null", () => {
    const listIndex = { at: vi.fn() };
    const handler = makeHandler({ info: { indexByWildcardPath: { "x.*.y": 1 } }, listIndex });
    const r = getContextListIndex(handler, "a.*.b");
    expect(r).toBeNull();
    expect(listIndex.at).not.toHaveBeenCalled();
  });

  it("index が見つかった場合は listIndex.at(index) を返す", () => {
    const ret = { li: 2 } as any;
    const listIndex = { at: vi.fn().mockReturnValue(ret) };
    const handler = makeHandler({ info: { indexByWildcardPath: { "a.*.b": 2 } }, listIndex });
    const r = getContextListIndex(handler, "a.*.b");
    expect(listIndex.at).toHaveBeenCalledWith(2);
    expect(r).toBe(ret);
  });

  it("index=0 のケースも正しく返す", () => {
    const ret = { li: 0 } as any;
    const listIndex = { at: vi.fn().mockReturnValue(ret) };
    const handler = makeHandler({ info: { indexByWildcardPath: { "a.*.b": 0 } }, listIndex });
    const r = getContextListIndex(handler, "a.*.b");
    expect(listIndex.at).toHaveBeenCalledWith(0);
    expect(r).toBe(ret);
  });
});
