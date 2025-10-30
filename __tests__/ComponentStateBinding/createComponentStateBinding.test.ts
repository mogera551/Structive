import { describe, it, expect, vi } from "vitest";
import { createComponentStateBinding } from "../../src/ComponentStateBinding/createComponentStateBinding";
import type { IBinding } from "../../src/DataBinding/types";
import { getStructuredPathInfo } from "../../src/StateProperty/getStructuredPathInfo";

function makeBinding(parentPattern: string, childSubName: string): IBinding & any {
  return {
    bindingState: { pattern: parentPattern },
    bindingNode: { subName: childSubName },
    engine: { id: Symbol("engine") },
  } as any;
}

describe("createComponentStateBinding", () => {
  it("addBinding: マッピングを構築し重複登録は例外", () => {
    const csb = createComponentStateBinding() as any;
    const b1 = makeBinding("parent.users.*", "child.users.*");
    const b2 = makeBinding("parent.profile", "child.profile");

    csb.addBinding(b1);
    csb.addBinding(b2);

    expect(csb.parentPaths.has("parent.users.*")).toBe(true);
    expect(csb.childPaths.has("child.users.*")).toBe(true);
    expect(csb.getChildPath("parent.profile")).toBe("child.profile");
    expect(csb.getParentPath("child.users.*")).toBe("parent.users.*");

    // 同じ parent を再登録 → 例外
    expect(() => csb.addBinding(makeBinding("parent.users.*", "X" as any))).toThrow(/already has a child path/);
    // 同じ child を再登録 → 例外
    expect(() => csb.addBinding(makeBinding("X", "child.users.*"))).toThrow(/already has a parent path/);
  });

  it("addBinding: 同一インスタンスは一度だけ追加される", () => {
    const csb = createComponentStateBinding() as any;
    const binding = makeBinding("parent.users.*", "child.users.*");

    csb.addBinding(binding);
    csb.addBinding(binding);

    expect(csb.parentPaths.size).toBe(1);
    expect(csb.childPaths.size).toBe(1);
  });

  it("toParentPathFromChildPath: 子パスから親パスへ、最長一致 + 残差の連結", () => {
    const csb = createComponentStateBinding() as any;
    csb.addBinding(makeBinding("parent.users.*", "child.users.*"));
    csb.addBinding(makeBinding("parent.profile", "child.profile"));

    const toParent = (child: string) => csb.toParentPathFromChildPath(child);
    expect(toParent("child.users.*.name")).toBe("parent.users.*.name");
    expect(toParent("child.profile.icon")).toBe("parent.profile.icon");

    // 存在しない → 例外
    expect(() => toParent("child.unknown" as any)).toThrow(/No parent path found/);

    // マッピングが欠損している場合も例外
    csb.parentPathByChildPath.delete("child.users.*");
    expect(() => toParent("child.users.*.age")).toThrow(/No parent path found/);
  });

  it("toChildPathFromParentPath: 親パスから子パスへ、最長一致 + 残差の連結", () => {
    const csb = createComponentStateBinding() as any;
    csb.addBinding(makeBinding("parent.users.*", "child.users.*"));

    const toChild = (parent: string) => csb.toChildPathFromParentPath(parent);
    expect(toChild("parent.users.*.name")).toBe("child.users.*.name");

    // 存在しない → 例外
    expect(() => toChild("parent.unknown" as any)).toThrow(/No child path found/);

    // マッピングが欠損している場合も例外
    csb.childPathByParentPath.delete("parent.users.*");
    expect(() => toChild("parent.users.*.name")).toThrow(/No child path found/);
  });

  it("startsWithByChildPath: 子側の最長一致 prefix を返す / 無ければ null", () => {
    const csb = createComponentStateBinding() as any;
    csb.addBinding(makeBinding("parent.users.*", "child.users.*"));
    csb.addBinding(makeBinding("parent.profile", "child.profile"));

    const info = getStructuredPathInfo("child.users.*.name");
    const pref = csb.startsWithByChildPath(info);
    expect(pref).toBe("child.users.*");

    const info2 = getStructuredPathInfo("child.unknown");
    expect(csb.startsWithByChildPath(info2)).toBeNull();
  });

  it("startsWithByChildPath: バインディングが無ければ null", () => {
    const csb = createComponentStateBinding() as any;
    const info = getStructuredPathInfo("child.users");
    expect(csb.startsWithByChildPath(info)).toBeNull();
  });

  it("bind: 親 comp から子 comp への binding を収集し登録する", () => {
    const csb = createComponentStateBinding() as any;
    const b1 = makeBinding("parent.users.*", "child.users.*");
    const b2 = makeBinding("parent.profile", "child.profile");

    const parent = {
      getBindingsFromChild: vi.fn(() => [b1, b2]),
    } as any;
    const child = {} as any;

    csb.bind(parent, child);

    expect(parent.getBindingsFromChild).toHaveBeenCalledWith(child);
    expect(csb.getParentPath("child.profile")).toBe("parent.profile");
  });

  it("bind: バインディング取得が未定義の場合は何もしない", () => {
    const csb = createComponentStateBinding() as any;
    const parent = {
      getBindingsFromChild: vi.fn(() => undefined),
    } as any;

    csb.bind(parent, {} as any);

    expect(parent.getBindingsFromChild).toHaveBeenCalled();
    expect(csb.parentPaths.size).toBe(0);
  });
});
