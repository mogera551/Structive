import { describe, it, expect } from "vitest";
import { BindingNodeBlock } from "../../../src/DataBinding/BindingNode/BindingNodeBlock";
import { createBindingStub, createEngineStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeBlock", () => {
  it("valid node で id を取得し isBlock が true", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|42");
    const binding = createBindingStub(engine, comment);
    const node = new BindingNodeBlock(binding, comment, "block", [], []);
    expect(node.id).toBe(42);
    expect(node.isBlock).toBe(true);
  });

  it("invalid node でエラー", () => {
    const engine = createEngineStub();
    const binding = createBindingStub(engine, {} as any);
    const fakeNode = {} as unknown as Node;
    expect(() => new (BindingNodeBlock as any)(binding, fakeNode, "block", [], [])).toThrow("Invalid node");
  });
});
