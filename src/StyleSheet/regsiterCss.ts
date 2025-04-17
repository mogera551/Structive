import { registerStyleSheet } from "./registerStyleSheet";

export function registerCss(id: number, css: string) {
  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(css);
  registerStyleSheet(id, styleSheet);
}