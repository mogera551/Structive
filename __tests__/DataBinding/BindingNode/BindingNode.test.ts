import { describe, it, expect, vi } from "vitest";
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
    node1.init();
    expect(node1.isSelectElement).toBe(true);
    expect(node1.name).toBe("value");
    expect(node1.subName).toBe("value");
    expect(node1.decorates).toEqual(["d1"]);
    expect(Array.isArray(node1.filters)).toBe(true);
    expect(Array.isArray(node1.bindContents)).toBe(true);
    expect(node1.value).toBeNull();
    expect(node1.filteredValue).toBeNull();
    expect(node1.isFor).toBe(false);
    expect(node1.isBlock).toBe(false);

    const div = document.createElement("div");
    const node2 = new BindingNode(binding as any, div, "textContent", [], []);
    expect(node2.isSelectElement).toBe(false);
  });

  it("applyChange でフィルタ済み値を1度だけ割り当て、2度目はスキップ", () => {
    class ConcreteBindingNode extends BindingNode {
      assigned: any[] = [];
      assignValue(value: any): void {
        this.assigned.push(value);
      }
    }
    const binding = {
      bindingState: {
        getFilteredValue: vi.fn(() => "filtered"),
      },
    } as any;
    const renderer = {
      updatedBindings: new Set<any>(),
      readonlyState: {},
      readonlyHandler: {},
    } as any;
    const node = new ConcreteBindingNode(binding, document.createElement("div"), "value", [], []);

    node.applyChange(renderer);
    expect(node.assigned).toEqual(["filtered"]);
    expect(binding.bindingState.getFilteredValue).toHaveBeenCalledTimes(1);

    node.applyChange(renderer);
    expect(node.assigned).toEqual(["filtered", "filtered"]);
    expect(binding.bindingState.getFilteredValue).toHaveBeenCalledTimes(2);
  });
});
