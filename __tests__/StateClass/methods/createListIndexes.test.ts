import { describe, it, expect } from "vitest";

import { createListIndexes } from "../../../src/StateClass/methods/createListIndexes";
import { createListIndex } from "../../../src/ListIndex/ListIndex";

function collectIndexes(indexes: ReturnType<typeof createListIndexes>) {
  return indexes.map((idx) => idx.index);
}

describe("StateClass/methods/createListIndexes", () => {
  it("新しい値が存在しない場合は空配列を返す", () => {
    const result = createListIndexes(null, ["a"], undefined, []);
    expect(result).toEqual([]);
  });

  it("旧リストが配列でなくても新しい listIndex を生成する", () => {
    const parent = createListIndex(null, 99);
    const result = createListIndexes(parent, null, ["x", "y"], []);

    expect(result).toHaveLength(2);
    expect(result[0].parentListIndex).toBe(parent);
    expect(result[1].parentListIndex).toBe(parent);
    expect(collectIndexes(result)).toEqual([0, 1]);
  });

  it("内容が完全一致する場合は旧インデックスをそのまま返す", () => {
    const indexes = [createListIndex(null, 0), createListIndex(null, 1)];
    const oldList = ["left", "right"];
    const newList = ["left", "right"];

    const result = createListIndexes(null, oldList, newList, indexes);
    expect(result).toBe(indexes);
  });

  it("並び替えと追加を混在させても適切に再利用・生成する", () => {
    const oldIndexes = [
      createListIndex(null, 0),
      createListIndex(null, 1),
      createListIndex(null, 2),
    ];
    const oldList = ["alpha", "beta", "gamma"];
    const newList = ["alpha", "gamma", "beta", "delta"];

    const result = createListIndexes(null, oldList, newList, oldIndexes);

    expect(result).toHaveLength(4);
    expect(result[0]).toBe(oldIndexes[0]);
    expect(result[0].index).toBe(0);
    expect(result[1]).toBe(oldIndexes[2]);
    expect(result[1].index).toBe(1);
    expect(result[2]).toBe(oldIndexes[1]);
    expect(result[2].index).toBe(2);
    expect(result[3]).not.toBe(oldIndexes[0]);
    expect(result[3]).not.toBe(oldIndexes[1]);
    expect(result[3]).not.toBe(oldIndexes[2]);
    expect(result[3].index).toBe(3);
  });

  it("重複した値は最後のインデックスを再利用する", () => {
    const oldIndexes = [createListIndex(null, 0), createListIndex(null, 1)];
    const oldList = ["dup", "dup"];
    const newList = ["dup"];

    const result = createListIndexes(null, oldList, newList, oldIndexes);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(oldIndexes[1]);
    expect(result[0].index).toBe(0);
  });

  it("同じ長さでも内容が変われば差分を計算する", () => {
    const oldIndexes = [createListIndex(null, 0), createListIndex(null, 1)];
    const oldList = ["stay", "move"];
    const newList = ["move", "new"];

    const result = createListIndexes(null, oldList, newList, oldIndexes);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(oldIndexes[1]);
    expect(result[0].index).toBe(0);
    expect(result[1]).not.toBe(oldIndexes[0]);
    expect(result[1].index).toBe(1);
  });
});
