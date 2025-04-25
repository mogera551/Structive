import { registerStyleSheet } from "./registerStyleSheet.js";
export function registerCss(id, css) {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    registerStyleSheet(id, styleSheet);
}
