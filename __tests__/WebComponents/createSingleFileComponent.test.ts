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
});
