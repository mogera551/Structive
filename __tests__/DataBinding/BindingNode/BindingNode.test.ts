import { describe, it, expect } from "vitest";
import { BindingNode } from "../../../src/DataBinding/BindingNode/BindingNode";

describe("BindingNode", () => {
  it("assignValue/updateElements は未実装エラー、notifyRedraw は何もしない", () => {
    const binding = {} as any;
    const div = document.createElement("div");
    const node = new BindingNode(binding as any, div, "value", [], []);
    expect(() => node.assignValue(1)).toThrowError(/not implemented/i);
    expect(() => node.updateElements([], [])).toThrowError(/not implemented/i);
    node.notifyRedraw([] as any);
  });

  it("isSelectElement の判定、各種ゲッター", () => {
    const binding = {} as any;
    const select = document.createElement("select");
    const node1 = new BindingNode(binding as any, select, "value", [], ["d1"]);
    expect(node1.isSelectElement).toBe(true);
    expect(node1.name).toBe("value");
    expect(node1.subName).toBe("value");
    expect(node1.decorates).toEqual(["d1"]);
    expect(Array.isArray(node1.filters)).toBe(true);
    expect(Array.isArray(node1.bindContents)).toBe(true);

    const div = document.createElement("div");
    const node2 = new BindingNode(binding as any, div, "textContent", [], []);
    expect(node2.isSelectElement).toBe(false);
  });
});
