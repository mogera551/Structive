import { describe, it, expect, vi, beforeEach } from "vitest";

// 共有状態: モック間で Updater インスタンスを受け渡すため
let capturedUpdater: any = null;

// useWritableStateProxy をモックして、updater と state をコールバックに渡す
vi.mock("../../src/StateClass/useWritableStateProxy", () => {
  return {
    useWritableStateProxy: vi.fn(async (engine: any, updater: any, _rawState: any, _loopContext: any, cb: (state: any) => Promise<void>) => {
      capturedUpdater = updater;
      // ダミーの writable state を渡す
      await cb({} as any);
    }),
  };
});

// Renderer.render をモックして呼び出しを検証
const renderMock = vi.fn();
vi.mock("../../src/Updater/Renderer", () => {
  return {
    render: (...args: any[]) => renderMock(...args),
  };
});

// SUT はモック定義の後に読み込む
import { update } from "../../src/Updater/Updater";

describe("Updater.update", () => {
  beforeEach(() => {
    renderMock.mockReset();
    capturedUpdater = null;
  });

  it("enqueue した Ref をマイクロタスクで1バッチにまとめて render へ渡す", async () => {
    const engine = {} as any;
    const refA = { id: "A" } as any;
    const refB = { id: "B" } as any;

    await update(engine, null, async (updater, _state) => {
      expect(updater).toBeTruthy();
      // 同一ティック内で複数回 enqueue → 1 回の render 呼び出しでバッチ化されるはず
      updater.enqueueRef(refA);
      updater.enqueueRef(refB);
    });

    // マイクロタスク（queueMicrotask）消化を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(renderMock).toHaveBeenCalledTimes(1);
    // 第1引数: refs 配列, 第2引数: engine
    const [refs, passedEngine] = renderMock.mock.calls[0];
    expect(passedEngine).toBe(engine);
    expect(Array.isArray(refs)).toBe(true);
    expect(refs).toHaveLength(2);
    expect(refs[0]).toBe(refA);
    expect(refs[1]).toBe(refB);
  });

  it("render 実行中に enqueue された Ref は同一レンダリングループで次バッチとして処理される", async () => {
    const engine = {} as any;
    const refA = { id: "A" } as any;
    const refC = { id: "C" } as any;

    // 1 回目の render 呼び出し時に、更に enqueue して 2 回目の render を誘発させる
    renderMock.mockImplementationOnce((refs: any[]) => {
      // 1 バッチ目は A のみ
      expect(refs).toHaveLength(1);
      // render 中（#rendering=true）の enqueue はマイクロタスクを追加せず、
      // Updater.rendering の while で同一ループ内に次バッチとして処理される想定
      capturedUpdater!.enqueueRef(refC);
    });

    await update(engine, null, async (updater, _state) => {
      updater.enqueueRef(refA);
    });

    // マイクロタスク消化を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(renderMock).toHaveBeenCalledTimes(2);
    const [refs1] = renderMock.mock.calls[0];
    const [refs2] = renderMock.mock.calls[1];
    expect(refs1).toHaveLength(1);
    expect(refs1[0]).toBe(refA);
    expect(refs2).toHaveLength(1);
    expect(refs2[0]).toBe(refC);
  });

  it("useWritableStateProxy に渡された updater が callback に渡る updater と同一", async () => {
    const engine = {} as any;
    let updaterFromCallback: any = null;

    await update(engine, null, async (updater, _state) => {
      updaterFromCallback = updater;
    });

    expect(capturedUpdater).toBe(updaterFromCallback);
  });

  it("enqueue が行われない場合、render は呼ばれない", async () => {
    const engine = {} as any;
    await update(engine, null, async (_updater, _state) => {
      // 何もしない
    });
    await Promise.resolve();
    expect(renderMock).not.toHaveBeenCalled();
  });
});
