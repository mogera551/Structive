/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { set as trapSet } from "../../src/StateClass/traps/set.js";

const getResolvedPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getResolvedPathInfo.js", () => ({
  getResolvedPathInfo: (prop: string) => getResolvedPathInfoMock(prop),
}));

const getListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getListIndex.js", () => ({
  getListIndex: (...args: any[]) => getListIndexMock(...args),
}));

const getStatePropertyRefMock = vi.fn();
vi.mock("../../src/StatePropertyRef/StatepropertyRef.js", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const setByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/setByRef.js", () => ({
  setByRef: (...args: any[]) => setByRefMock(...args),
}));

beforeEach(() => {
  getResolvedPathInfoMock.mockReset();
  getListIndexMock.mockReset();
  getStatePropertyRefMock.mockReset();
  setByRefMock.mockReset();
});

describe("StateClass trap set", () => {
  it("文字列プロパティは resolved → listIndex → setByRef の順で処理", () => {
    const target = {};
    const receiver = {} as any;
    const handler = { engine: {} } as any;
    const resolved = { info: { pattern: "foo.bar" } };
    const listIndex = { index: 1 };

    const ref = { info: resolved.info, listIndex };
    getResolvedPathInfoMock.mockReturnValue(resolved);
    getListIndexMock.mockReturnValue(listIndex);
    getStatePropertyRefMock.mockReturnValue(ref);
    setByRefMock.mockReturnValue(true);

    const result = trapSet(target, "foo", 42, receiver, handler);

    expect(result).toBe(true);
    expect(getResolvedPathInfoMock).toHaveBeenCalledWith("foo");
    expect(getListIndexMock).toHaveBeenCalledWith(resolved, receiver, handler);
    expect(getStatePropertyRefMock).toHaveBeenCalledWith(resolved.info, listIndex);
    expect(setByRefMock).toHaveBeenCalledWith(target, ref, 42, receiver, handler);
  });

  it("シンボルプロパティは Reflect.set を利用", () => {
    const sym = Symbol("test");
    const target: any = {};
    const receiver: any = {};
    const handler = {} as any;

    const result = trapSet(target, sym, "value", receiver, handler);

    expect(result).toBe(true);
    expect(receiver[sym]).toBe("value");
    expect(setByRefMock).not.toHaveBeenCalled();
  });
});
