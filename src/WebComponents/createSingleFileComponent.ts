/**
 * createSingleFileComponent.ts
 *
 * Structive用のシングルファイルコンポーネント（SFC）をパースし、各要素（HTML, CSS, StateClass）を抽出・生成するユーティリティです。
 *
 * 主な役割:
 * - テキストから<template>・<script type="module">・<style>を抽出し、それぞれを分離
 * - <script type="module">はBase64エンコードして動的importし、StateClassとして利用
 * - {{...}}埋め込み式は一時的にコメントノード化してHTMLパース時の消失を防止し、復元
 * - 各要素（html, css, stateClass, text）をIUserComponentDataとして返却
 *
 * 設計ポイント:
 * - escapeEmbed/unescapeEmbedでMustache構文の安全なパースを実現
 * - scriptはdata:URL経由で安全に動的import
 * - テンプレート・スクリプト・スタイルを柔軟に分離・管理できる設計
 */
import { IStructiveState } from "../StateClass/types";
import { IUserComponentData } from "./types";

function escapeEmbed(html: string): string {
  return html.replaceAll(/\{\{([^\}]+)\}\}/g, (match, expr) => {
    return `<!--{{${expr}}}-->`;
  });
}

function unescapeEmbed(html:string):string {
  return html.replaceAll(/<!--\{\{([^\}]+)\}\}-->/g, (match, expr) => {
    return `{{${expr}}}`;
  });
}

let id = 0;

export async function createSingleFileComponent(text: string): Promise<IUserComponentData> {
  const template = document.createElement("template");
  template.innerHTML = escapeEmbed(text);

  const html = template.content.querySelector("template");
  html?.remove();

  const script = template.content.querySelector("script[type=module]") as HTMLScriptElement | null;
  let scriptModule: any = {};
  if (script) {
    const uniq_comment = `\r\n/*__UNIQ_ID_${id++}__*/`;
    const b64 = btoa(String.fromCodePoint(...new TextEncoder().encode(script.text + uniq_comment)));
    scriptModule = await import("data:application/javascript;base64," + b64);
  }
//  const scriptModule = script ? await import("data:text/javascript;charset=utf-8," + script.text) : {};
  script?.remove();

  const style = template.content.querySelector("style");
  style?.remove();

  const stateClass = (scriptModule.default ?? class {}) as IStructiveState;
  
  return {
    text,
    html      : unescapeEmbed(html?.innerHTML ?? "").trim(),
    css       : style?.textContent ?? "",
    stateClass,
  }
}