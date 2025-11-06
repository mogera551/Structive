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
    createReadonlyStateHandlerMock.mockImplementation((engine: any, updater: any, renderer: any) => ({ engine, updater, renderer }));
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

describe("Updater.collectMaybeUpdates", () => {
  beforeEach(() => {
    calcListDiffMock.mockReset();
    findPathNodeByPathMock.mockReset();
    createReadonlyStateHandlerMock.mockReset();
    createReadonlyStateProxyMock.mockReset();
    createReadonlyStateHandlerMock.mockImplementation((engine: any, updater: any, renderer: any) => ({ engine, updater, renderer }));
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

    const revisionMap = new Map<string, { version: number; revision: number }>();
    await createUpdater(engine, (updater) => {
  (updater as any).collectMaybeUpdates(engine, "root", revisionMap, 1);
      expect(Array.from(revisionMap.entries())).toEqual([
        ["root", { version: 1, revision: 1 }],
        ["child", { version: 1, revision: 1 }],
        ["dep", { version: 1, revision: 1 }],
      ]);
      expect(findPathNodeByPathMock).toHaveBeenCalledTimes(2);
      // キャッシュ経路の再利用を確認
      findPathNodeByPathMock.mockClear();
      revisionMap.clear();
  (updater as any).collectMaybeUpdates(engine, "root", revisionMap, 2);
      expect(Array.from(revisionMap.entries())).toEqual([
        ["root", { version: 1, revision: 2 }],
        ["child", { version: 1, revision: 2 }],
        ["dep", { version: 1, revision: 2 }],
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
      const revisionMap = new Map<string, { version: number; revision: number }>();
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
        (updater as any).collectMaybeUpdates(engine, "missing", engine.versionRevisionByPath, 4);
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
    createReadonlyStateHandlerMock.mockImplementation((engine: any, updater: any, renderer: any) => ({ engine, updater, renderer, handler: true }));
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

  it("swapInfoByRef が Map インスタンスを返す", async () => {
    const engine = createEngineStub();
    const ref = createRef("cache");

    await createUpdater(engine, (updater) => {
      const swapInfoMap = updater.swapInfoByRef;

      expect(swapInfoMap).toBeInstanceOf(Map);

      const swapInfo = { swapped: true } as any;

      swapInfoMap.set(ref, swapInfo);

      expect(updater.swapInfoByRef.get(ref)).toBe(swapInfo);
    });
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

    expect(createReadonlyStateHandlerMock).toHaveBeenCalledWith(engine, expect.any(Object), null);
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
        (updater as any).collectMaybeUpdates(engine, "root", engine.versionRevisionByPath, 1);
      });
    }).toThrowError(/Path node not found for pattern: missing/);
  });

  it("recursiveCollectMaybeUpdates は子要素も依存も無いノードを訪問済みに追加する", async () => {
    const engine = {
      ...createEngineStub(),
      pathManager: {
        rootNode: createPathNode("leaf"),
        dynamicDependencies: new Map(),
        lists: new Set<string>(),
        elements: new Set<string>(),
      },
    };

    await createUpdater(engine, (updater) => {
      const visited = new Set<string>();
      (updater as any).recursiveCollectMaybeUpdates(engine, "leaf", createPathNode("leaf"), visited, false);
      expect(Array.from(visited)).toEqual(["leaf"]);
    });
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
    versionRevisionByPath: new Map<string, { version: number; revision: number }>(),
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
