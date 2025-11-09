import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { createBinding } from "../../../src/DataBinding/Binding";
import { createBindingNodeComponent } from "../../../src/DataBinding/BindingNode/BindingNodeComponent";
import { NotifyRedrawSymbol } from "../../../src/ComponentStateInput/symbols";
import { getStatePropertyRef } from "../../../src/StatePropertyRef/StatepropertyRef";

// ヘルパー: 簡易な info/listIndex を生成
function makeInfo(pattern: string, pathSegments: string[], wildcardCount: number, cumulative: string[]): any {
  return {
    pattern,
    pathSegments,
    wildcardCount,
    cumulativePathSet: new Set(cumulative),
    sid: `${pattern}|${wildcardCount}`,
  };
}

function makeListIndex(sid: string, selfAt0 = false): any {
  const li: any = {
    parentListIndex: null,
    id: 1,
    sid,
    position: 0,
    length: 1,
    index: 0,
    version: 1,
    dirty: false,
    indexes: [],
    listIndexes: [],
    varName: "i",
    at: (pos: number) => {
      if (!selfAt0) return null;
      if (pos === 0 || pos === -1) return li;
      return null;
    },
  };
  return li;
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("BindingNodeComponent", () => {
  let engine: any;
  let component: any;
  let parentComponent: any;
  let node: HTMLElement;
  let binding: any;

  beforeAll(() => {
    if (!customElements.get("mock-component")) {
      customElements.define("mock-component", class extends HTMLElement {});
    }
  });

  beforeEach(() => {
    parentComponent = document.createElement("div") as any;
    parentComponent.isStructive = true;
    parentComponent.state = { [NotifyRedrawSymbol]: vi.fn() } as any;
    engine = {
      owner: parentComponent,
      bindingsByComponent: new WeakMap<any, Set<any>>()
    };
    node = document.createElement("mock-component");
    component = node as any;
    component.isStructive = true;
    component.state = { [NotifyRedrawSymbol]: vi.fn() } as any;
    component.waitForInitialize = { promise: Promise.resolve() };

    const parentBindContent = {} as any;
    const info = makeInfo("values.*.foo", ["values","*","foo"], 1, ["values","values.*","values.*.foo"]);
    let currentListIndex: any = makeListIndex("LI#A", true);
    const createBindingState = vi.fn(() => {
      let currentRef = getStatePropertyRef(info, currentListIndex);
      return {
        info,
        get listIndex() {
          return currentListIndex;
        },
        set listIndex(value: any) {
          currentListIndex = value ?? null;
          currentRef = getStatePropertyRef(info, currentListIndex);
        },
        get ref() {
          return currentRef;
        },
        getFilteredValue: () => 0,
        assignValue: vi.fn(),
        init: vi.fn(),
        isLoopIndex: false,
      };
    });
    const createNode = createBindingNodeComponent("state.foo", [], []);
    binding = createBinding(parentBindContent, node, engine, createNode as any, createBindingState as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("subName ゲッターと assignValue の no-op を通過", () => {
    const componentNode = binding.bindingNode as any;
    expect(componentNode.subName).toBe("foo");
    expect(() => componentNode.assignValue("value")).toThrow(/Not implemented/);
  });

  it("component の listIndex が null でも親パス更新を通知する", async () => {
    binding.init();
    binding.bindingState.listIndex = null;
    const parentInfo = makeInfo("values", ["values"], 0, ["values", "values.*", "values.*.foo"]);
    const parentListIndex = makeListIndex("LI#parent", true);
    const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
    binding.notifyRedraw([parentRef]);
    await flushPromises();
    const calls = (component.state[NotifyRedrawSymbol] as any).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0][0]).toBe(parentRef);
  });

  it("notifyRedraw: waitForInitialize 解決後に通知する", async () => {
    binding.init();
    const refs = [binding.bindingState.ref];
    let resolveInitialize!: () => void;
    component.waitForInitialize = { promise: new Promise<void>((resolve) => {
      resolveInitialize = resolve;
    }) };
  const whenDefinedSpy = vi.spyOn(customElements, "whenDefined").mockResolvedValue(customElements.get("mock-component")!);

    (binding.bindingNode as any)._notifyRedraw(refs);
    await Promise.resolve();
    expect(whenDefinedSpy).toHaveBeenCalledWith("mock-component");
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);

    resolveInitialize();
    await Promise.resolve();
    await Promise.resolve();

    const calls = (component.state[NotifyRedrawSymbol] as any).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(refs);
  });

  it("applyChange: バインディングの ref を通知する", () => {
    binding.init();
    const node = binding.bindingNode as any;
    const notifySpy = vi.spyOn(node, "_notifyRedraw");
    const renderer = {} as any;

    node.applyChange(renderer);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notifySpy.mock.calls[0][0]).toEqual([binding.bindingState.ref]);
  });

  it("init: bindingsByComponent に登録され、親 StructiveComponent が紐づく", () => {
    binding.init();
    const set = engine.bindingsByComponent.get(component)!;
    expect(set).toBeTruthy();
    expect(set.has(binding)).toBe(true);
  });

  it("notifyRedraw: 親パス更新（component パターンを含む）をそのまま通知", async () => {
    binding.init();
  const info = binding.bindingState.info;
  const listIndex = binding.bindingState.listIndex;
    // 親パス values の更新を模す（短いパス）
  const parentInfo = makeInfo("values", ["values"], 0, ["values", "values.*", "values.*.foo"]);
    const parentRef = getStatePropertyRef(parentInfo, listIndex);
    binding.notifyRedraw([parentRef]);
    await flushPromises();
    const notifyCalls = (component.state[NotifyRedrawSymbol] as any).mock.calls;
    expect(notifyCalls.length).toBe(1);
    const forwarded = notifyCalls[0][0][0];
    expect(forwarded).toBe(parentRef);
  });

  it("notifyRedraw: 子パスで component パターンを含まない場合は通知しない", async () => {
    binding.init();
    // 自分の pattern は values.*.foo。含まれない別ツリー（values.*.bar）
  const childInfo = makeInfo("values.*.bar", ["values","*","bar"], 1, ["values","values.*","values.*.bar"]);
  const childRef = getStatePropertyRef(childInfo as any, binding.bindingState.listIndex);
    binding.notifyRedraw([childRef]);
    await flushPromises();
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: listIndex 不一致はスキップ（子パス側）", async () => {
    binding.init();
    // listIndex が異なる子パス → 通知しない
    const otherListIndex = makeListIndex("LI#B", true);
    const childInfo = makeInfo("values.*.bar", ["values","*","bar"], 1, ["values","values.*","values.*.bar"]);
    const childRef = getStatePropertyRef(childInfo as any, otherListIndex);
    binding.notifyRedraw([childRef]);
    await flushPromises();
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: cumulativePathSet に含まれない親パターンはスキップ", async () => {
    binding.init();
    const unrelatedInfo = makeInfo("others", ["others"], 0, ["others"]);
    const unrelatedRef = getStatePropertyRef(unrelatedInfo as any, null);
    binding.notifyRedraw([unrelatedRef]);
    await flushPromises();
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: 親パスで listIndex が一致する場合は親 Ref を通知", async () => {
    binding.init();
    const listIndex = binding.bindingState.listIndex;
    const parentInfo = makeInfo("values.*", ["values","*"], 1, ["values","values.*","values.*.foo"]);
    const parentRef = getStatePropertyRef(parentInfo as any, listIndex);
    binding.notifyRedraw([parentRef]);
    await flushPromises();
    const notifyCalls = (component.state[NotifyRedrawSymbol] as any).mock.calls;
    expect(notifyCalls.length).toBe(1);
    const forwarded = notifyCalls[0][0][0];
    expect(forwarded).toBe(parentRef);
  });

  it("notifyRedraw: 親パスで listIndex が異なる場合は通知しない", async () => {
    binding.init();
    const mismatchListIndex = makeListIndex("LI#Mismatch", true);
    const parentInfo = makeInfo("values.*", ["values","*"], 1, ["values","values.*","values.*.foo"]);
    const parentRef = getStatePropertyRef(parentInfo as any, mismatchListIndex);
    binding.notifyRedraw([parentRef]);
    await flushPromises();
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: 自身のパターン更新は通知しない", async () => {
    binding.init();
    const info = binding.bindingState.info;
  const listIndex = binding.bindingState.listIndex;
    const sameRef = getStatePropertyRef(info as any, listIndex);
    binding.notifyRedraw([sameRef]);
    await flushPromises();
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });
});
