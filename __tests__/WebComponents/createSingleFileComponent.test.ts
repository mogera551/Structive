/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { createSingleFileComponent } from "../../src/WebComponents/createSingleFileComponent";

describe("WebComponents/createSingleFileComponent", () => {
  it("<template> の HTML を抽出し、{{ }} を保持する（script/style なし）", async () => {
    const sfc = `
      <template>
        <div class="x">Hello {{name}}</div>
      </template>
    `;
    const res = await createSingleFileComponent(sfc);
    expect(res.html.trim()).toBe('<div class="x">Hello {{name}}</div>');
    expect(res.css).toBe("");
    expect(typeof res.stateClass).toBe("function");
  });

  it("<style> を抽出し、CSS テキストを返す", async () => {
    const sfc = `
      <template>
        <p>text</p>
      </template>
      <style>
        .x{color:red}
      </style>
    `;
    const res = await createSingleFileComponent(sfc);
    expect(res.html.trim()).toBe('<p>text</p>');
    expect(res.css.replace(/\s+/g, "")).toBe('.x{color:red}');
  });

  it("<script type=module> の default export を stateClass として返す", async () => {
    const sfc = `
      <template>
        <section>ok</section>
      </template>
      <script type="module">
        export default class MyState { static $config = { enabled: true } }
      </script>
    `;
    const res = await createSingleFileComponent(sfc);
    expect(res.html.trim()).toBe('<section>ok</section>');
    expect(typeof res.stateClass).toBe("function");
    // static プロパティが参照できること
    expect((res.stateClass as any).$config).toEqual({ enabled: true });
  });

  it("<template> が存在しない場合は空 HTML を返す", async () => {
    const sfc = `
      <style>.no-template{display:none}</style>
      <script type="module">export const value = 1;</script>
    `;
    const res = await createSingleFileComponent(sfc);
    expect(res.html).toBe("");
    expect(res.css.replace(/\s+/g, "")).toBe('.no-template{display:none}');
    // default export が無い場合は空クラスが返る
    expect(Object.getPrototypeOf(res.stateClass)).toBe(Function.prototype);
  });
});
