/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReadonlyStateHandler, createReadonlyStateProxy } from "../../src/StateClass/createReadonlyStateProxy";
import { useWritableStateProxy } from "../../src/StateClass/useWritableStateProxy";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol, SetCacheableSymbol } from "../../src/StateClass/symbols";

const trapGetMock = vi.fn();
vi.mock("../../src/StateClass/traps/get.js", () => ({
  get: (...args: any[]) => trapGetMock(...args),
}));

const trapSetMock = vi.fn().mockReturnValue(true);
vi.mock("../../src/StateClass/traps/set.js", () => ({
  set: (...args: any[]) => trapSetMock(...args),
}));

beforeEach(() => {
  trapGetMock.mockReset();
  trapSetMock.mockReset();
  trapSetMock.mockReturnValue(true);
});

function makeEngine() {
  return {
    pathManager: {
      onlyGetters: new Set<string>(),
      getters: new Set<string>(),
      setters: new Set<string>(),
      lists: new Set<string>(),
      elements: new Set<string>(),
      addDynamicDependency: vi.fn(),
    },
    getListIndexes: vi.fn(),
    owner: {},
    cache: new Map(),
    stateOutput: {
      startsWith: vi.fn().mockReturnValue(false),
      get: vi.fn(),
    },
  } as any;
}

function makeUpdater() {
  return {
    version: 1,
    revision: 0,
    revisionByUpdatedPath: new Map<string, number>(),
    calcListDiff: vi.fn(),
  } as any;
}

describe("StateClass proxies", () => {
  it("createReadonlyStateProxy: get は trap を経由し set は例外", () => {
    const engine = makeEngine();
    const updater = makeUpdater();
    const handler = createReadonlyStateHandler(engine, updater);
    const state = { foo: 1 };
    const proxy = createReadonlyStateProxy(state, handler);

  trapGetMock.mockImplementation((target, prop, receiver) => {
      if (prop === "foo") {
        return "READ";
      }
      return Reflect.get(target as any, prop, receiver);
    });

    expect((proxy as any)["foo"]).toBe("READ");
    expect(trapGetMock).toHaveBeenCalledWith(state, "foo", proxy, handler);
    expect(() => {
      (proxy as any).bar = 1;
    }).toThrowError(/Cannot set property bar of readonly state/);
  });

  it("createReadonlyStateProxy: has トラップはシンボルと API を判定", () => {
    const engine = makeEngine();
    const updater = makeUpdater();
    const handler = createReadonlyStateHandler(engine, updater);
    const state = { foo: 1 };
    const proxy = createReadonlyStateProxy(state, handler);

    expect("foo" in proxy).toBe(true);
    expect("missing" in proxy).toBe(false);
    expect(GetByRefSymbol in proxy).toBe(true);
    expect(SetCacheableSymbol in proxy).toBe(false);
    expect("$resolve" in proxy).toBe(true);
    expect("$getAll" in proxy).toBe(true);
    expect("$trackDependency" in proxy).toBe(true);
    expect("$navigate" in proxy).toBe(true);
    expect("$component" in proxy).toBe(true);
  });

  it("useWritableStateProxy: get/set がトラップ経由で呼ばれる", async () => {
    const engine = makeEngine();
    const updater = makeUpdater();
    const state = { foo: 1 };

  trapGetMock.mockImplementation((target, prop, receiver) => {
      if (prop === "foo") {
        return "WRITE";
      }
      return Reflect.get(target as any, prop, receiver);
    });

    await useWritableStateProxy(engine, updater, state, null, async (proxy) => {
      expect((proxy as any).foo).toBe("WRITE");
      expect(trapGetMock).toHaveBeenCalled();
      (proxy as any).foo = 2;
      expect(trapSetMock).toHaveBeenCalled();
    });
  });

  it("useWritableStateProxy: has トラップはシンボルと API を判定", async () => {
    const engine = makeEngine();
    const updater = makeUpdater();
    const state = { foo: 1 };

    await useWritableStateProxy(engine, updater, state, null, async (proxy) => {
      expect("foo" in proxy).toBe(true);
      expect(GetByRefSymbol in proxy).toBe(true);
      expect(SetByRefSymbol in proxy).toBe(true);
      expect(ConnectedCallbackSymbol in proxy).toBe(true);
      expect(DisconnectedCallbackSymbol in proxy).toBe(true);
      expect("$resolve" in proxy).toBe(true);
      expect("$getAll" in proxy).toBe(true);
      expect("$trackDependency" in proxy).toBe(true);
      expect("$navigate" in proxy).toBe(true);
      expect("$component" in proxy).toBe(true);
    });
  });
});
