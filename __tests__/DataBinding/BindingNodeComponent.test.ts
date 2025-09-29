import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createBinding } from "../../src/DataBinding/Binding";
import { createBindingNodeComponent } from "../../src/DataBinding/BindingNode/BindingNodeComponent";
import { NotifyRedrawSymbol } from "../../src/ComponentStateInput/symbols";
import { getStatePropertyRef } from "../../src/StatePropertyRef/StatepropertyRef";

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
    const otherListIndex = makeListIndex("LI#B", false);
    const childInfo = makeInfo("values.*.foo.bar", ["values","*","foo","bar"], 1, ["values","values.*","values.*.foo","values.*.foo.bar"]);
    const childRef = getStatePropertyRef(childInfo as any, otherListIndex);
    binding.notifyRedraw([childRef]);
    // 呼び出しが増えていないこと
    expect((component.state[NotifyRedrawSymbol] as any).mock.calls.length).toBe(0);
  });
});
