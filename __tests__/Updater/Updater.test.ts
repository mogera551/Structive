import { describe, it, expect, vi, beforeEach } from "vitest";

// 共有状態: モック間で Updater インスタンスを受け渡すため
let capturedUpdater: any = null;

const calcListDiffMock = vi.fn();
const findPathNodeByPathMock = vi.fn();
const createReadonlyStateHandlerMock = vi.fn();
const createReadonlyStateProxyMock = vi.fn();

// useWritableStateProxy をモックして、updater / state / handler をコールバックに渡す
vi.mock("../../src/StateClass/useWritableStateProxy", () => {
  return {
    useWritableStateProxy: vi.fn(async (engine: any, updater: any, _rawState: any, _loopContext: any, cb: (state: any, handler: any) => Promise<void>) => {
      capturedUpdater = updater;
      const dummyHandler = {} as any;
      // ダミーの writable state/handler を渡す
      await cb({} as any, dummyHandler);
    }),
  };
});

vi.mock("../../src/StateClass/createReadonlyStateProxy", () => ({
  createReadonlyStateHandler: (...args: any[]) => createReadonlyStateHandlerMock(...args),
  createReadonlyStateProxy: (...args: any[]) => createReadonlyStateProxyMock(...args),
}));

// Renderer.render をモックして呼び出しを検証
const renderMock = vi.fn();
vi.mock("../../src/Updater/Renderer", () => {
  return {
    render: (...args: any[]) => renderMock(...args),
  };
});

vi.mock("../../src/PathTree/PathNode", () => ({
  findPathNodeByPath: (...args: any[]) => findPathNodeByPathMock(...args),
}));

vi.mock("../../src/ListDiff/ListDiff", () => ({
  calcListDiff: (...args: any[]) => calcListDiffMock(...args),
}));

// SUT はモック定義の後に読み込む
import { createUpdater } from "../../src/Updater/Updater";

async function withUpdater(engine: any, loopContext: any, callback: (updater: any, state: any, handler: any) => Promise<void> | void) {
  await createUpdater(engine, async (updater) => {
    await updater.update(loopContext, async (state: any, handler: any) => {
      await callback(updater, state, handler);
    });
  });
}

describe("Updater.update", () => {
  beforeEach(() => {
    renderMock.mockReset();
    capturedUpdater = null;
    calcListDiffMock.mockReset();
    findPathNodeByPathMock.mockReset();
    createReadonlyStateHandlerMock.mockReset();
    createReadonlyStateProxyMock.mockReset();
    createReadonlyStateHandlerMock.mockImplementation(() => ({}));
    createReadonlyStateProxyMock.mockImplementation(() => ({}));
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      childNodeByName: new Map<string, any>(),
      currentPath: pattern,
    }));
  });

  it("enqueue した Ref をマイクロタスクで1バッチにまとめて render へ渡す", async () => {
    const engine = createEngineStub();
    const refA = createRef("foo");
    const refB = createRef("bar");

    await withUpdater(engine, null, async (updater) => {
      expect(updater).toBeTruthy();
      // 同一ティック内で複数回 enqueue → 1 回の render 呼び出しでバッチ化されるはず
      updater.enqueueRef(refA);
      updater.enqueueRef(refB);
    });

    // マイクロタスク（queueMicrotask）消化を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(renderMock).toHaveBeenCalledTimes(1);
    // 第1引数: refs 配列, 第2引数: engine, 第3引数: updater
    const [refs, passedEngine, passedUpdater] = renderMock.mock.calls[0];
    expect(passedEngine).toBe(engine);
    expect(passedUpdater).toBe(capturedUpdater);
    expect(Array.isArray(refs)).toBe(true);
    expect(refs).toHaveLength(2);
    expect(refs[0]).toBe(refA);
    expect(refs[1]).toBe(refB);
  });

  it("render 実行中に enqueue された Ref は同一レンダリングループで次バッチとして処理される", async () => {
    const engine = createEngineStub();
    const refA = createRef("foo");
    const refC = createRef("baz");

    // 1 回目の render 呼び出し時に、更に enqueue して 2 回目の render を誘発させる
    renderMock.mockImplementationOnce((refs: any[]) => {
      // 1 バッチ目は A のみ
      expect(refs).toHaveLength(1);
      // render 中（#rendering=true）の enqueue はマイクロタスクを追加せず、
      // Updater.rendering の while で同一ループ内に次バッチとして処理される想定
      capturedUpdater!.enqueueRef(refC);
    });

    await withUpdater(engine, null, async (updater) => {
      updater.enqueueRef(refA);
    });

    // マイクロタスク消化を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(renderMock).toHaveBeenCalledTimes(2);
  const [refs1, , updater1] = renderMock.mock.calls[0];
  const [refs2, , updater2] = renderMock.mock.calls[1];
    expect(refs1).toHaveLength(1);
    expect(refs1[0]).toBe(refA);
    expect(refs2).toHaveLength(1);
    expect(refs2[0]).toBe(refC);
  expect(updater1).toBe(updater2);
  });

  it("useWritableStateProxy に渡された updater が callback に渡る updater と同一", async () => {
    const engine = createEngineStub();
    let updaterFromCallback: any = null;

    await withUpdater(engine, null, async (updater) => {
      updaterFromCallback = updater;
    });

    expect(capturedUpdater).toBe(updaterFromCallback);
  });

  it("enqueue が行われない場合、render は呼ばれない", async () => {
    const engine = createEngineStub();
    await withUpdater(engine, null, async (_updater) => {
      // 何もしない
    });
    await Promise.resolve();
    expect(renderMock).not.toHaveBeenCalled();
  });
});

describe("Updater.calcListDiff", () => {
  beforeEach(() => {
    calcListDiffMock.mockReset();
    createReadonlyStateHandlerMock.mockReset();
    createReadonlyStateProxyMock.mockReset();
    createReadonlyStateHandlerMock.mockImplementation(() => ({}));
    createReadonlyStateProxyMock.mockImplementation(() => ({}));
  });

  it("既存差分があり同一なら再計算のみで終了する", async () => {
    const engine = createEngineStub();
    const ref = createListRef("list:ref");
    await createUpdater(engine, (updater) => {
      const existingDiff = {
        same: false,
        newListValue: ["existing"],
        newIndexes: [{ index: 0 }],
      } as any;
      updater.setListDiff(ref, existingDiff);

      calcListDiffMock.mockReturnValueOnce({
        same: true,
        newListValue: ["existing"],
        newIndexes: [{ index: 0 }],
      });

      const result = updater.calcListDiff(ref, ["next"]);
      expect(result).toBe(false);
      expect(calcListDiffMock).toHaveBeenCalledTimes(1);
      expect(engine.saveListAndListIndexes).not.toHaveBeenCalled();
    });
  });

  it("差分があれば保存処理を行う", async () => {
    const engine = createEngineStub();
    const ref = createListRef("list:ref");
    const saveInfo = {
      list: ["old"],
      listIndexes: [{ index: 0 }],
      listClone: ["old"],
    };
    engine.getListAndListIndexes.mockReturnValue(saveInfo);

    await createUpdater(engine, (updater) => {
      const diff = {
        same: false,
        newListValue: ["new"],
        newIndexes: [{ index: 0 }],
        changeIndexes: new Set(),
        overwrites: new Set(),
      } as any;
      calcListDiffMock.mockReturnValueOnce(diff);

      const result = updater.calcListDiff(ref, ["new"]);
      expect(result).toBe(true);
      expect(calcListDiffMock).toHaveBeenCalledWith(ref.listIndex, saveInfo.list, ["new"], saveInfo.listIndexes);
      expect(engine.saveListAndListIndexes).toHaveBeenCalledWith(ref, diff.newListValue, diff.newIndexes);
      expect(updater.getListDiff(ref)).toBe(diff);
      expect(updater.oldValueAndIndexesByRef.get(ref)).toBe(saveInfo);
    });
  });

  it("差分が同一なら保存せず false を返す", async () => {
    const engine = createEngineStub();
    const ref = createListRef("list:ref");
    engine.getListAndListIndexes.mockReturnValue(undefined);
    await createUpdater(engine, (updater) => {
      const diff = {
        same: true,
        newListValue: ["same"],
        newIndexes: [{ index: 0 }],
      } as any;
      calcListDiffMock.mockReturnValueOnce(diff);

      const result = updater.calcListDiff(ref, ["same"]);
      expect(result).toBe(false);
      expect(engine.saveListAndListIndexes).not.toHaveBeenCalled();
      expect(updater.getListDiff(ref)).toBe(diff);
      expect(updater.oldValueAndIndexesByRef.has(ref)).toBe(false);
    });
  });

  it("既存差分があり再計算で差分が発生した場合は保存し直す", async () => {
    const engine = createEngineStub();
    const ref = createListRef("list:ref");
    const saveInfo = {
      list: ["legacy"],
      listIndexes: [{ index: 0 }],
      listClone: ["legacy"],
    };
    engine.getListAndListIndexes.mockReturnValue(saveInfo);

    await createUpdater(engine, (updater) => {
      const existingDiff = {
        same: false,
        newListValue: ["existing"],
        newIndexes: [{ index: 0 }],
      } as any;
      updater.setListDiff(ref, existingDiff);

      const intermediateDiff = {
        same: false,
        newListValue: ["candidate"],
        newIndexes: [{ index: 0 }],
      } as any;
      const finalDiff = {
        same: false,
        newListValue: ["final"],
        newIndexes: [{ index: 0 }],
        overwrites: new Set(),
        changeIndexes: new Set(),
      } as any;

      calcListDiffMock
        .mockReturnValueOnce(intermediateDiff)
        .mockReturnValueOnce(finalDiff);

      const result = updater.calcListDiff(ref, ["final"]);

      expect(result).toBe(true);
      expect(calcListDiffMock).toHaveBeenNthCalledWith(1, ref.listIndex, existingDiff.newListValue, ["final"], existingDiff.newIndexes);
      expect(calcListDiffMock).toHaveBeenNthCalledWith(2, ref.listIndex, saveInfo.list, ["final"], saveInfo.listIndexes);
      expect(engine.saveListAndListIndexes).toHaveBeenCalledWith(ref, finalDiff.newListValue, finalDiff.newIndexes);
      expect(updater.getListDiff(ref)).toBe(finalDiff);
      expect(updater.oldValueAndIndexesByRef.get(ref)).toBe(saveInfo);
    });
  });

  it("差分の新リストが未定義でも null 保存と初期キャッシュを行う", async () => {
    const engine = createEngineStub();
    const ref = createListRef("list:ref");
    engine.getListAndListIndexes.mockReturnValue(undefined);

    await createUpdater(engine, (updater) => {
      const diff = {
        same: false,
        newListValue: undefined,
        newIndexes: undefined,
        changeIndexes: new Set(),
        overwrites: new Set(),
      } as any;
      calcListDiffMock.mockReturnValueOnce(diff);

      const result = updater.calcListDiff(ref, ["missing"]);
      expect(result).toBe(true);
      expect(engine.saveListAndListIndexes).toHaveBeenCalledWith(ref, null, diff.newIndexes);
      expect(updater.oldValueAndIndexesByRef.get(ref)).toEqual({ list: null, listIndexes: null, listClone: null });
    });
  });
});

describe("Updater.collectMaybeUpdates", () => {
  beforeEach(() => {
    calcListDiffMock.mockReset();
    findPathNodeByPathMock.mockReset();
    createReadonlyStateHandlerMock.mockReset();
    createReadonlyStateProxyMock.mockReset();
    createReadonlyStateHandlerMock.mockImplementation(() => ({}));
    createReadonlyStateProxyMock.mockImplementation(() => ({}));
  });

  it("パスツリーと依存を再帰的に収集しキャッシュする", async () => {
    const childNode = createPathNode("child");
    const rootNode = createPathNode("root", new Map([["child", childNode]]));
    const depNode = createPathNode("dep");

    const engine = {
      ...createEngineStub(),
      pathManager: {
        rootNode,
        dynamicDependencies: new Map([
          ["root", ["dep"]],
          ["dep", []],
        ]),
        lists: new Set<string>(),
        elements: new Set<string>(),
      },
    };

    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return rootNode;
      if (pattern === "child") return childNode;
      if (pattern === "dep") return depNode;
      return null;
    });

    const revisionMap = new Map<string, number>();
    await createUpdater(engine, (updater) => {
  (updater as any).collectMaybeUpdates(engine, "root", revisionMap, 1);
      expect(Array.from(revisionMap.entries())).toEqual([
        ["root", 1],
        ["child", 1],
        ["dep", 1],
      ]);
      expect(findPathNodeByPathMock).toHaveBeenCalledTimes(2);
      // キャッシュ経路の再利用を確認
      findPathNodeByPathMock.mockClear();
      revisionMap.clear();
  (updater as any).collectMaybeUpdates(engine, "root", revisionMap, 2);
      expect(Array.from(revisionMap.entries())).toEqual([
        ["root", 2],
        ["child", 2],
        ["dep", 2],
      ]);
      expect(findPathNodeByPathMock).toHaveBeenCalledTimes(1);
    });
  });

  it("起点が elements に含まれている場合は再帰を行わない", async () => {
    const engine = {
      ...createEngineStub(),
      pathManager: {
        rootNode: createPathNode("root"),
        dynamicDependencies: new Map(),
        lists: new Set<string>(),
        elements: new Set<string>(["root"]),
      },
    };

    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") {
        return { currentPath: "root", childNodeByName: new Map() };
      }
      return null;
    });

    await createUpdater(engine, (updater) => {
      const revisionMap = new Map<string, number>();
  (updater as any).collectMaybeUpdates(engine, "root", revisionMap, 3);
      expect(revisionMap.size).toBe(0);
    });
  });

  it("PathNode が見つからない場合はエラーを投げる", async () => {
    const engine = {
      ...createEngineStub(),
      pathManager: {
        rootNode: createPathNode("root"),
        dynamicDependencies: new Map(),
        lists: new Set<string>(),
        elements: new Set<string>(),
      },
    };

    findPathNodeByPathMock.mockReturnValue(null);

    try {
      createUpdater(engine, (updater) => {
        (updater as any).collectMaybeUpdates(engine, "missing", updater.revisionByUpdatedPath, 4);
      });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toMatchObject({ code: "UPD-003" });
    }
  });

  it("recursiveCollectMaybeUpdates は既訪問パスをスキップする", async () => {
    const engine = {
      ...createEngineStub(),
      pathManager: {
        rootNode: createPathNode("root"),
        dynamicDependencies: new Map(),
        lists: new Set<string>(),
        elements: new Set<string>(),
      },
    };

    await createUpdater(engine, (updater) => {
      const visited = new Set<string>(["root"]);
      (updater as any).recursiveCollectMaybeUpdates(engine, "root", createPathNode("root"), visited, true);
      expect(visited.size).toBe(1);
    });
  });
});

describe("Updater その他のAPI", () => {
  beforeEach(() => {
    renderMock.mockReset();
    calcListDiffMock.mockReset();
    findPathNodeByPathMock.mockReset();
    createReadonlyStateHandlerMock.mockReset();
    createReadonlyStateProxyMock.mockReset();
    createReadonlyStateHandlerMock.mockImplementation((_engine: any, _updater: any) => ({ handler: true }));
    createReadonlyStateProxyMock.mockImplementation((_state: any, _handler: any) => ({ state: true }));
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      childNodeByName: new Map<string, any>(),
      currentPath: pattern,
    }));
  });

  it("version と revision ゲッターが現在値を返す", async () => {
    const engine = createEngineStub();
    engine.versionUp.mockReturnValue(7);
    const ref = createRef("foo");

    await createUpdater(engine, async (updater) => {
      expect(updater.version).toBe(7);
      expect(updater.revision).toBe(0);
      updater.enqueueRef(ref);
      expect(updater.revision).toBe(1);
    });
  });

  it("getOldValueAndIndexes は既存キャッシュを優先する", async () => {
    const engine = createEngineStub();
    const ref = createRef("list");
    const cached = { list: ["cached"], listIndexes: [], listClone: ["cached"] } as any;

    await createUpdater(engine, (updater) => {
      updater.oldValueAndIndexesByRef.set(ref, cached);
      const result = (updater as any).getOldValueAndIndexes(ref);
      expect(result).toBe(cached);
      expect(engine.getListAndListIndexes).not.toHaveBeenCalled();
    });
  });

  it("getOldValueAndIndexes はキャッシュが無い場合にエンジンへフォールバックする", async () => {
    const engine = createEngineStub();
    const ref = createRef("list");
    const fetched = { list: ["fetched"], listIndexes: [], listClone: ["fetched"] } as any;
    engine.getListAndListIndexes.mockReturnValue(fetched);

    await createUpdater(engine, (updater) => {
      const result = (updater as any).getOldValueAndIndexes(ref);
      expect(result).toBe(fetched);
    });
    expect(engine.getListAndListIndexes).toHaveBeenCalledWith(ref);
  });

  it("createReadonlyState で生成した state と handler をコールバックへ渡す", async () => {
    const engine = createEngineStub();
    const fakeHandler = { token: "handler" };
    const fakeState = { token: "state" };
    createReadonlyStateHandlerMock.mockReturnValueOnce(fakeHandler);
    createReadonlyStateProxyMock.mockReturnValueOnce(fakeState);

    await createUpdater(engine, (updater) => {
      const returned = updater.createReadonlyState((state, handler) => {
        expect(state).toBe(fakeState);
        expect(handler).toBe(fakeHandler);
        return "done";
      });
      expect(returned).toBe("done");
    });

    expect(createReadonlyStateHandlerMock).toHaveBeenCalledWith(engine, expect.any(Object));
    expect(createReadonlyStateProxyMock).toHaveBeenCalledWith(engine.state, fakeHandler);
  });

  it("collectMaybeUpdates で依存ノードが見つからない場合は UPD-004", () => {
    const rootNode = createPathNode("root");
    const engine = {
      ...createEngineStub(),
      pathManager: {
        rootNode,
        dynamicDependencies: new Map([["root", ["missing"]]]),
        lists: new Set<string>(),
        elements: new Set<string>(),
      },
    };

    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return rootNode;
      return null;
    });

    expect(() => {
      createUpdater(engine, (updater) => {
        (updater as any).collectMaybeUpdates(engine, "root", updater.revisionByUpdatedPath, 1);
      });
    }).toThrowError(/Path node not found for pattern: missing/);
  });
});

function createEngineStub(): any {
  return {
    state: {},
    versionUp: vi.fn(() => 1),
    pathManager: {
      rootNode: { childNodeByName: new Map<string, any>(), currentPath: "" },
      dynamicDependencies: new Map<string, Set<string>>(),
      lists: new Set<string>(),
      elements: new Set<string>(),
    },
    getListAndListIndexes: vi.fn(() => ({ list: null, listIndexes: null, listClone: null })),
    saveListAndListIndexes: vi.fn(),
  } as any;
}

function createRef(pattern: string) {
  return {
    info: { pattern },
    listIndex: null,
    key: `${pattern}-null`,
  } as any;
}

function createListRef(pattern: string) {
  return {
    info: { pattern },
    listIndex: { index: 0 },
    key: `${pattern}-list`,
  } as any;
}

function createPathNode(path: string, childNodeByName: Map<string, any> = new Map()) {
  return {
    currentPath: path,
    childNodeByName,
  };
}
