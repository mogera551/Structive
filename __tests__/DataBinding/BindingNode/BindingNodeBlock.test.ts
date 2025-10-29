import { describe, it, expect } from "vitest";
import { BindingNodeBlock } from "../../../src/DataBinding/BindingNode/BindingNodeBlock";
import { createBindingStub, createEngineStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeBlock", () => {
  it("invalid node でエラー", () => {
    const engine = createEngineStub();
    const binding = createBindingStub(engine, {} as any);
    const fakeNode = {} as unknown as Node;
    expect(() => new (BindingNodeBlock as any)(binding, fakeNode, "block", [], [])).toThrow("Invalid node");
  });
});
