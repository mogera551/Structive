/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { loadImportmap } from "../../src/WebComponents/loadImportmap";

describe("WebComponents/loadImportmap", () => {
  it("複数 importmap の imports をマージ", () => {
    document.body.innerHTML = `
      <script type="importmap">{ "imports": { "@a/": "/a/" } }</script>
      <script type="importmap">{ "imports": { "@b/": "/b/" } }</script>
    `;
    const im = loadImportmap();
    expect(im.imports).toBeTruthy();
    expect(im.imports!["@a/"]).toBe("/a/");
    expect(im.imports!["@b/"]).toBe("/b/");
  });
});
