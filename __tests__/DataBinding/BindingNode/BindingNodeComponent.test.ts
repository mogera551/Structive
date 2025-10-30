import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    at: (pos: number) => (selfAt0 && pos === 0 ? li : null),
  };
  return li;
}

describe("BindingNodeComponent", () => {
  let engine: any;
  let component: any;
  let parentComponent: any;
  let node: HTMLElement;
  let binding: any;

  beforeEach(() => {
    parentComponent = document.createElement("div") as any;
    parentComponent.isStructive = true;
    parentComponent.state = { [NotifyRedrawSymbol]: vi.fn() } as any;
    engine = {
      owner: parentComponent,
      bindingsByComponent: new WeakMap<any, Set<any>>()
    };
    node = document.createElement("div");
    component = node as any;
    component.isStructive = true;
    component.state = { [NotifyRedrawSymbol]: vi.fn() } as any;

    const parentBindContent = {} as any;
    const createBindingState = vi.fn(() => ({
      info: makeInfo("values.*.foo", ["values","*","foo"], 1, ["values","values.*","values.*.foo"]),
      listIndex: [ makeListIndex("LI#A", true) ],
      getFilteredValue: () => 0,
      assignValue: vi.fn(),
      init: vi.fn(),
    }));
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
    componentNode.assignValue("value");
  });

  it("listIndex が null の親パス更新は通知しない", () => {
    binding.init();
    (binding.bindingState as any).listIndex = undefined;
    const parentInfo = makeInfo("values", ["values"], 0, ["values"]);
    const parentRef = {
      info: parentInfo,
      listIndex: {
        length: 1,
        at: () => ({ sid: "LI#parent" }),
      },
    } as any;
    binding.notifyRedraw([parentRef]);
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("init: bindingsByComponent に登録され、親 StructiveComponent が紐づく", () => {
    binding.init();
    const set = engine.bindingsByComponent.get(component)!;
    expect(set).toBeTruthy();
    expect(set.has(binding)).toBe(true);
  });

  it("notifyRedraw: 親パス更新（cumulativePathSet に含まれる）で own ref に差し替え通知", () => {
    binding.init();
    const info = binding.bindingState.info;
    const listIndex = binding.bindingState.listIndex[0];
    // 親パス values の更新を模す（短いパス）
    const parentInfo = makeInfo("values", ["values"], 0, ["values"]);
    const parentRef = getStatePropertyRef(parentInfo, null);
    binding.notifyRedraw([parentRef]);
    // 自分の info + listIndex で作った ref が渡る
    const expectedRef = getStatePropertyRef(info, listIndex);
    const calledWith = (component.state[NotifyRedrawSymbol] as any).mock.calls[0][0] as any[];
    expect(calledWith[0].key).toBe(expectedRef.key);
  });

  it("notifyRedraw: 子パス更新（ref.info.cumulativePathSet に自分のパターンがない）をそのまま通知", () => {
    binding.init();
    // 自分の pattern は values.*.foo。含まれない別ツリー（values.*.bar）
    const childInfo = makeInfo("values.*.bar", ["values","*","bar"], 1, ["values","values.*","values.*.bar"]);
    const childRef = getStatePropertyRef(childInfo as any, binding.bindingState.listIndex[0]);
    binding.notifyRedraw([childRef]);
    const calledWith = (component.state[NotifyRedrawSymbol] as any).mock.calls.at(-1)[0] as any[];
    expect(calledWith[0].key).toBe(childRef.key);
  });

  it("notifyRedraw: listIndex 不一致はスキップ（子パス側）", () => {
    binding.init();
    // listIndex が異なる子パス → 通知しない
    const otherListIndex = makeListIndex("LI#B", true);
    const childInfo = makeInfo("values.*.bar", ["values","*","bar"], 1, ["values","values.*","values.*.bar"]);
    const childRef = getStatePropertyRef(childInfo as any, otherListIndex);
    binding.notifyRedraw([childRef]);
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: cumulativePathSet に含まれない親パターンはスキップ", () => {
    binding.init();
    const unrelatedInfo = makeInfo("others", ["others"], 0, ["others"]);
    const unrelatedRef = getStatePropertyRef(unrelatedInfo as any, null);
    binding.notifyRedraw([unrelatedRef]);
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: 親パスで listIndex null はスキップ", () => {
    binding.init();
    (binding.bindingState as any).listIndex = [];
    const parentInfo = makeInfo("values.*", ["values","*"], 1, ["values","values.*"]);
    const parentListIndex = makeListIndex("LI#Parent", true);
    const parentRef = getStatePropertyRef(parentInfo as any, parentListIndex);
    binding.notifyRedraw([parentRef]);
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: 親パスで listIndex が一致する場合は通知", () => {
    binding.init();
    const info = binding.bindingState.info;
    const listIndex = binding.bindingState.listIndex[0];
    const parentInfo = makeInfo("values.*", ["values","*"], 1, ["values","values.*"]);
    const parentRef = getStatePropertyRef(parentInfo as any, listIndex);
    binding.notifyRedraw([parentRef]);
    const expectedRef = getStatePropertyRef(info, listIndex);
    const called = (component.state[NotifyRedrawSymbol] as any).mock.calls.at(-1)[0][0];
    expect(called.key).toBe(expectedRef.key);
  });

  it("notifyRedraw: 親パスで listIndex が異なる場合は通知しない", () => {
    binding.init();
    const mismatchListIndex = makeListIndex("LI#Mismatch", true);
    const parentInfo = makeInfo("values.*", ["values","*"], 1, ["values","values.*"]);
    const parentRef = getStatePropertyRef(parentInfo as any, mismatchListIndex);
    binding.notifyRedraw([parentRef]);
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });

  it("notifyRedraw: 自身のパターン更新は通知しない", () => {
    binding.init();
    const info = binding.bindingState.info;
    const listIndex = binding.bindingState.listIndex[0];
    const sameRef = getStatePropertyRef(info as any, listIndex);
    binding.notifyRedraw([sameRef]);
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });
});
